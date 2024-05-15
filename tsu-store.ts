import {BehaviorSubject, Observable} from "rxjs";
import {last, map, merge, size, toNumber, toString} from "lodash";
import {StoreDefinition} from "./tsu-store.interface";
import moment from "moment";
import {deepDiff} from "./deep-diff";


export interface StateBase {
  sid?: string
}

export class TsuStore<StoreType> {

  private readonly state$: BehaviorSubject<StoreType>;
  private initialState: StoreType
  private readonly name: string
  private readonly storageName: string
  private currentPosition: number
  private readonly history$: Array<{
    changes: any
    _timestamp: string
    name?: string
    position: number
  }>;


  constructor(definition: StoreDefinition<StoreType>) {
    this.state$ = new BehaviorSubject<StoreType>(definition.initialState)
    this.history$ = [{
      changes: {},
      _timestamp: moment().toISOString(),
      name: "",
      position: 0,
    }]
    this.initialState = definition.initialState
    this.name = definition.name
    this.storageName = "tsuStore_" + this.name
    this.currentPosition = 0
  }

  private updateHistory(newState: StoreType, callback: () => void) {
    const diff = deepDiff(newState, this.getState())
    if (size(diff) === 0) {
      //no changes
      callback()
      return
    }

    this.currentPosition = toNumber(last(this.history$)?.position) + 1
    if(size(this.history$) >= 5) {
      this.history$.shift()
    }

    this.history$.push({
      changes: diff,
      _timestamp: moment().toISOString(),
      position: this.currentPosition,
    })

    //console.log("this.history$:", this.history$, "\ndiff", diff)
    callback()

    try {
      localStorage.setItem(this.storageName, JSON.stringify(map(this.history$, o => {
        return {name: o.name, position: o.position, _timestamp: o._timestamp}
      })))
    } catch (e) {
      localStorage.setItem("er", toString(e))
    }

  }

  public setState(newState: StoreType | null, isLoading: boolean = false) {
    const currentState = this.getState() as StoreType
    this.updateHistory(newState as StoreType, () => {
      setTimeout(() => {
        const newStateX = merge(currentState, {...newState, isLoading: isLoading}) as StoreType
        this.state$.next(newStateX)
      }, 1)
    })
  }


  public stateUndo() {
    const currentState = this.getState()
    const nstate = this.history$[size(this.history$) - 1]
    setTimeout(() => this.state$.next(merge(currentState, nstate?.changes)), 1)
  }

  public getState() {
    return this.state$.getValue()
  }

  public observe(): Observable<StoreType> {
    return this.state$.pipe()
  }

  public clearState() {
    //
  }
}

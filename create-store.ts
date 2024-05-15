import {StoreDefinition} from "./tsu-store.interface";
import {TsuStore} from "./tsu-store";

interface ICreateStore {
}

function createStore<StoreType>(definition: StoreDefinition<StoreType & ICreateStore>) {
  return new TsuStore<StoreType>(definition)
}

export default createStore



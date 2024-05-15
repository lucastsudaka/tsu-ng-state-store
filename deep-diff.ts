// @ts-nocheck
import {entries, get, has, isArray, isEqual, isObject, isObjectLike, isUndefined, keys} from "lodash";

/**
 * Deep diff between two object-likes
 * @param  {Object} fromObject the original object
 * @param  {Object} toObject   the updated object
 * @return {Object}            a new object which represents the diff
 */
export function deepDiff(fromObject, toObject) {
  const changes = {};
  const allChanges ={}

  const buildPath = (path, obj, key) => {
    const origVal = get(obj, key);
    if (isUndefined(path)) {
      if (isArray(origVal)) {
        changes[key] = [];
      } else if (isObject(origVal)) {
        changes[key] = {};
      }
    } else {
      if (isArray(origVal)) {
        path[key] = [];
      } else if (isObject(origVal)) {
        path[key] = {};
      }
    }
    return [isUndefined(path) ? changes : path, key]
  }


  const walk = (fromObject, toObject, path) => {
    for (const key of keys(fromObject)) {
      const objKeyPair = buildPath(path, fromObject, key);
      if (!has(toObject, key)) {
        objKeyPair[0][objKeyPair[1]] = { from: get(fromObject, key) };
      }
    }

    for (const [key, to] of entries(toObject)) {
      const isLast = has(fromObject, key);
      const objKeyPair = buildPath(path, fromObject, key);
      if (isLast) {
        const from = get(fromObject, key);
        if (!isEqual(from, to)) {
          if (isObjectLike(to) && isObjectLike(from)) {
            walk(from, to, objKeyPair[0][objKeyPair[1]]);
          } else {
            objKeyPair[0][objKeyPair[1]] = { __old: from, __new: to };
            allChanges[key] = to
          }
        } else {
          delete objKeyPair[0][objKeyPair[1]]
        }
      } else {
        objKeyPair[0][objKeyPair[1]] = { to };
      }
    }
  };

  walk(fromObject, toObject);

  return allChanges;
}

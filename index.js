const CollectionObj = require('./object');
const noInit = Symbol();

class Collection {

    constructor(data, model, _noInit) {
        if (model && typeof model.$isModel === 'function' && model.$isModel() === true) {
            this.model = model;
            this.server = model.$getServer();
        } else {
            this.model = CollectionObj;
            this.server = null;
        }
        if (_noInit === noInit)
            this.data = data;
        else
            this.data = initData(data, this.model, this.server);
    }

    get(num) {
        if (typeof num === 'number')
            if (num === 1)
                return this.data[0];
            else
                return this.data.slice(0, num);
        else
            return this.data;
    }

    avg(key) {
        let length = this.data.length;
        let sum = this.sum(key);
        return sum / length;
    }

    chunk(chunkLength) {
        if (chunkLength <= 1)
            return this.clone();
        let data = this.clone().data;
        let length = data.length;
        let newData = [];
        let chunk, i;
        for (i = 0; i < length / chunkLength;) {
            chunk = data.slice(i * chunkLength, ++i * chunkLength);
            newData.push(chunk);
        }
        return newData;
    }

    clone() {
        let newData = [];
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            newData.push(item);
        }
        return this._new(newData);
    }

    combine(key, value) {
        let self = this;
        let map = new Map();
        let data = [];
        for (let item of self.data) {
            let mapKey = '';
            for (let itemKey in item)
                if (item.hasOwnProperty(itemKey) && itemKey !== key && itemKey !== value)
                    mapKey += `${itemKey}:${item[itemKey]};`;
            if (map.has(mapKey))
                map.get(mapKey).push(item);
            else
                map.set(mapKey, [item]);
        }
        for (let items of map.values()) {
            let first = true;
            const datum = {};
            for (let item of items) {
                if (first) {
                    first = false;
                    for (let itemKey in item)
                        if (item.hasOwnProperty(itemKey) && itemKey !== key && itemKey !== value)
                            datum[itemKey] = item[itemKey];
                }
                datum[item[key]] = item[value];
            }
            data.push(datum);
        }
        return new Collection(data);
    }

    contains(key, value) {
        for (let item of this.data)
            if (item[key] === value)
                return true;
        return false;
    }

    count() {
        return this.data.length;
    }

    each(callback) {
        let collection = this.clone();
        for (let item of collection.data) {
            let res = callback(item);
            if (res === false)
                break;
        }
        return collection;
    }

    every(callback) {
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res === false)
                return false;
        }
        return true;
    }

    except(keys) {
        let newData = [];
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            for (let key of keys)
                delete item[key];
            newData.push(item);
        }
        return this._new(newData);
    }

    filter(callback) {
        let newData = [];
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res === true)
                newData.push(item);
        }
        return this._new(newData);
    }

    first(callback) {
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res === true)
                return item;
        }
        return false;
    }

    groupBy(key) {
        let data = {};
        for (let item of this.data) {
            let name = item[key];
            if (Array.isArray(data[name]))
                data[name].push(newModel(item, this.model, this.server));
            else
                data[name] = [newModel(item, this.model, this.server)];
        }
        return data;
    }

    has(key) {
        for (let item of this.data) {
            let res = item[key];
            if (res === undefined)
                return false;
        }
        return true;
    }

    implode(key, separator) {
        let str = '';
        for (let i = 0; i < this.data.length;) {
            str += this.data[i][key];
            if (++i !== this.data.length)
                str += separator;
        }
        return str;
    }

    isEmpty() {
        return this.data.length === 0;
    }

    last(callback) {
        let data = this.data.slice().reverse();
        for (let item of data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res === true)
                return item;
        }
        return false;
    }

    max(key) {
        return this.data.reduce((max, next) => {
            if (max[key] >= next[key])
                return max;
            return next;
        })[key];
    }

    min(key) {
        return this.data.reduce((min, next) => {
            if (min[key] <= next[key])
                return min;
            return next;
        })[key];
    }

    nth(n) {
        let newData = [];
        for (let i = 0; i < this.data.length; i += n)
            newData.push(newModel(this.data[i], this.model, this.server));
        return this._new(newData);
    }

    only(keys) {
        let newData = [];
        for (let item of this.data) {
            let newItem = {};
            for (let key of keys)
                if (item[key] !== undefined)
                    newItem[key] = item[key];
            newItem = newModel(newItem, this.model, this.server);
            newData.push(newItem);
        }
        return this._new(newData);
    }

    paginate(perPage, current) {
        current = current || 1;
        let total = this.data.length;
        let data = this.chunk(perPage);
        return {
            total: total,
            perPage: perPage,
            totalPages: data.length,
            currentPage: current,
            data: data[current - 1]
        };
    }

    partition(callback) {
        let dataTrue = [];
        let dataFalse = [];
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res === true)
                dataTrue.push(item);
            else if (res === false)
                dataFalse.push(item);
        }
        return [this._new(dataTrue), this._new(dataFalse)];
    }

    pluck(key) {
        let data = [];
        for (let item of this.data)
            if (item[key] !== undefined)
                data.push(item[key]);
        return data;
    }

    pop() {
        return this.data.pop();
    }

    prepend(item) {
        let collection = this.clone();
        if (typeof item === 'object')
            collection.data.unshift(newModel(item, this.model, this.server));
        else
            throw new Error('The Member of Collection expected Object,' + typeof item + ' given');
        return collection;
    }

    push(item) {
        let collection = this.clone();
        if (typeof item === 'object')
            collection.data.push(newModel(item, this.model, this.server));
        else
            throw new Error('The Member of Collection expected Object,' + typeof item + ' given');
        return collection;
    }

    random() {
        let key = Math.floor(Math.random() * this.data.length);
        return this.data[key];
    }

    reduce(callback) {
        let data = this.clone().data;
        return data.reduce(callback);
    }

    reject(callback) {
        let newData = [];
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res !== true)
                newData.push(item);
        }
        return this._new(newData);
    }

    reverse() {
        let collection = this.clone();
        collection.data.reverse();
        return collection;
    }

    shift() {
        return this.data.shift();
    }

    shuffle() {
        let collection = this.clone();
        let data = collection.data;
        let i = data.length;
        let j, tmp;
        while (i) {
            j = Math.floor(Math.random() * i);
            tmp = data[--i];
            data[i] = data[j];
            data[j] = tmp;
        }
        return collection;
    }

    slice(begin, end) {
        let collection = this.clone();
        collection.data = collection.data.slice(begin, end);
        return collection;
    }

    some(callback) {
        for (let item of this.data) {
            item = newModel(item, this.model, this.server);
            let res = callback(item);
            if (res === true)
                return true;
        }
        return false;
    }

    sort(compareFunction) {
        let collection = this.clone();
        collection.data.sort(compareFunction);
        return collection;
    }

    sortBy(key, method) {
        let collection = this.clone();
        if (typeof method === 'string')
            method = method.toLowerCase();
        method = method === 'desc' ? -1 : 1;
        collection.data.sort((x, y) => {
            if (x[key] > y[key])
                return method;
            return -method;
        });
        return collection;
    }

    splice(start, deleteCount, ...items) {
        deleteCount = deleteCount || this.data.length - start;
        const $items = [];
        for (let item of items)
            if (typeof item === 'object')
                $items.push(newModel(item, this.model, this.server));
        const data = this.data.splice(start, deleteCount, ...$items);
        return this._new(data);
    }

    sum(key) {
        let value = 0;
        for (let item of this.data)
            value += item[key];
        return value;
    }

    take(num) {
        let collection = this.clone();
        if (num >= 0)
            collection.data = collection.data.slice(0, num);
        else
            collection.data = collection.data.slice(num);
        return collection;
    }

    tap(callback) {
        let collection = this.clone();
        for (let item of collection.data) {
            callback(item);
        }
        return this;
    }

    toJson(space) {
        return JSON.stringify(this.data, null, space);
    }

    union(source) {
        if (source instanceof Collection)
            source = source.clone();
        else
            throw new Error('The parameter of union() expected Collection');
        let collection = this.clone();
        collection.data.push(...source.data);
        return collection;
    }

    where(key, op, value) {
        if (value === undefined) {
            value = op;
            op = '=';
        }
        return this.filter(item => {
            return opFilter(item[key], op, value);
        });
    }

    whereIn(key, arr) {
        return this.filter(item => {
            if (arr.indexOf(item[key]) >= 0)
                return true;
        });
    }

    whereNotIn(key, arr) {
        return this.filter(item => {
            if (arr.indexOf(item[key]) < 0)
                return true;
        });
    }

    _new(data) {
        return new Collection(data, this.model, noInit);
    }

    [Symbol.iterator]() {
        return this.data[Symbol.iterator]();
    }

}

const initData = (arr, model, server) => {
    let data = [];
    for (let item of arr) {
        if (typeof item === 'object')
            data.push(newModel(item, model, server));
        else
            throw new Error('The Member of Collection expected Object,' + typeof item + ' given');
    }
    return data;
};

const newModel = (data, model, server) => {
    if (model === CollectionObj)
        return new model(data);
    else {
        class _model extends model {
        }

        _model.prototype.$getServer = () => server;
        return new _model(data);
    }
};

const opFilter = (item, op, value) => {
    switch (op) {
        case '=':
            return item === value;
        case '<>':
            return item !== value;
        case '>':
            return item > value;
        case '>=':
            return item >= value;
        case '<':
            return item < value;
        case '<=':
            return item <= value;
        default:
            return false;
    }
};

exports = module.exports = Collection;
exports.CollectionObj = CollectionObj;
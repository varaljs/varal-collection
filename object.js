class CollectionObj {

    constructor(obj) {
        Object.assign(this, obj);
    }

    toMap() {
        let map = new Map();
        for (let key in this)
            if (this.hasOwnProperty(key))
                map.set(key, this[key]);
        return map;
    }

    toJson() {
        return JSON.stringify(this);
    }

    diff(target) {
        let data = {};
        for (let key in this)
            if (this.hasOwnProperty(key) && this[key] !== target[key])
                data[key] = this[key];
        return new CollectionObj(data);
    }

    except(keys) {
        let data = {};
        for (let key in this)
            if (this.hasOwnProperty(key) && keys.indexOf(key) < 0)
                data[key] = this[key];
        return new CollectionObj(data);
    }

    forget(key) {
        delete this[key];
    }

    keys() {
        let data = [];
        for (let key in this)
            if (this.hasOwnProperty(key))
                data.push(key);
        return data;
    }

    same(target) {
        let data = {};
        for (let key in this)
            if (this.hasOwnProperty(key) && this[key] === target[key])
                data[key] = this[key];
        return new CollectionObj(data);
    }

    only(keys) {
        let data = {};
        for (let key in this)
            if (this.hasOwnProperty(key) && keys.indexOf(key) >= 0)
                data[key] = this[key];
        return new CollectionObj(data);
    }

    values() {
        let data = [];
        for (let value of this)
            data.push(value);
        return data;
    }

    [Symbol.iterator]() {
        let data = [];
        let index = 0;
        for (let key in this)
            if (this.hasOwnProperty(key))
                data.push(this[key]);
        return {
            next: function () {
                if (index >= data.length)
                    return {
                        value: undefined,
                        done: true
                    };
                return {
                    value: data[index++],
                    done: false
                };
            }
        };
    }

}

exports = module.exports = CollectionObj;
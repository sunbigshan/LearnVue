function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        configurable: true,
        writable: true,
    })
}

function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
}
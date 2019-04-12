const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);

[
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
].forEach((method) => {
    const original = arrayProto[method];
    
    Object.defineProperty(arrayMethods, method, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function mutator(...args) {
            console.log(`触发了${method}`)
            return original.apply(this, args);
        }
    })
})
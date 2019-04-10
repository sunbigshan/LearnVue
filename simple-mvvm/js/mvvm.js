class MVVM {
    constructor(options = {}) {
        this.$options = options;
        let data = this._data = this.$options.data;
        
        Object.keys(data).forEach((key) => {
            this._proxyData(key)
        })

        new Observer(data);

        this.$compile = new Compile(options.el || document.body, this)
    }

    _proxyData(key) {
        let _this = this;
        Object.defineProperty(_this, key, {
            enumerable: true,
            configurable: true,
            get() {
                return _this._data[key];
            },
            set(val) {
                _this._data[key] = val;
            }
        })
    }
}
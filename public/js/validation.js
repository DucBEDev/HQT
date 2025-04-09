window.restrictNameInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value.normalize('NFC');
        const filteredValue = value.replace(/[0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '');
        if (value !== filteredValue) {
            this.value = filteredValue;
        }
    });
};

window.restrictPhoneInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value.normalize('NFC');
        const filteredValue = value.replace(/[^0-9]/g, '').slice(0, 10);
        if (value !== filteredValue) {
            this.value = filteredValue;
        }

        if (filteredValue.length === 10) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });

    input.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.keyCode || e.which);
        if (!/[0-9]/.test(char)) {
            e.preventDefault();
        }
    });
};

window.restrictCitizenIdInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value.normalize('NFC');
        const filteredValue = value.replace(/[^0-9]/g, '').slice(0, 12);
        if (value !== filteredValue) {
            this.value = filteredValue;
        }

        if (filteredValue.length === 12) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });

    input.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.keyCode || e.which);
        if (!/[0-9]/.test(char)) {
            e.preventDefault();
        }
    });
};

window.restrictSpecialCharInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value.normalize('NFC');
        const filteredValue = value.replace(/[!"#$%&'()*+,-.:;<=>?@[\]^_`{|}~]/g, '');
        if (value !== filteredValue) {
            this.value = filteredValue;
        }
    });
};
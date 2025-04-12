window.restrictNameInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const filteredValue = value.replace(/[0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '');
        const errorElementId = input.id + 'Error';
        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }
    });
};

window.restrictNumberInput = function (input, maxLength) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const filteredValue = value.replace(/[^0-9]/g, '').slice(0, maxLength);
        const errorElementId = input.id + 'Error';

        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } 
        
        if (filteredValue.length !== maxLength) {
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
            document.getElementById(errorElementId).style.display = 'none';
        }
    });
};

window.restrictSpecialCharInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value.normalize('NFC');
        const filteredValue = value.replace(/[!"#$%&'()*+,-.:;<=>?@[\]^_`{|}~]/g, '');
        const errorElementId = input.id + 'Error';
        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }
    });
};

window.restrictEmailInput = function (input) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
        const errorElementId = input.id + 'Error';
        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }
    });
};
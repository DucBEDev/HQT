window.restrictNameInput = function (input, maxLength = 0) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const errorElementId = input.id + 'Error';
        let filteredValue;

        if (maxLength > 0) {
            filteredValue = value.replace(/[0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '').slice(0, maxLength);
        } else {
            filteredValue = value.replace(/[0-9!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '');
        }

        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }

        if (maxLength > 0) {
            if (filteredValue.length !== maxLength) {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
                document.getElementById(errorElementId).style.display = 'block';
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
                document.getElementById(errorElementId).style.display = 'none';
            }
        }
    });
};

window.restrictNumberInput = function (input, maxLength = 0) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        const errorElementId = input.id + 'Error';
        let filteredValue;  

        if (maxLength > 0) {
            filteredValue = value.replace(/[^0-9]/g, '').slice(0, maxLength);
        } else {
            filteredValue = value.replace(/[^0-9]/g, '');
        }

        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }
        
        if (maxLength > 0) {
            if (filteredValue.length !== maxLength) {
                console.log("Chay vao day ", filteredValue)
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
                document.getElementById(errorElementId).style.display = 'block';
            } else {
                console.log("Chay vao day 2 ", filteredValue)

                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
                document.getElementById(errorElementId).style.display = 'none';
            }
        }
    });
};

window.restrictSpecialCharInput = function (input, maxLength = 0) {
    input.addEventListener('input', function(e) {
        const value = this.value.normalize('NFC');
        const errorElementId = input.id + 'Error';
        let filteredValue;

        if (maxLength > 0) {    
            filteredValue = value.replace(/[!"#$%&'()*+,-.:;<=>?@[\]^_`{|}~]/g, '').slice(0, maxLength);
        } else {
            filteredValue = value.replace(/[!"#$%&'()*+,-.:;<=>?@[\]^_`{|}~]/g, '');
        }

        if (value !== filteredValue) {
            this.value = filteredValue;
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById(errorElementId).style.display = 'none';
        }

        if (maxLength > 0) {
            if (filteredValue.length !== maxLength) {
                this.classList.remove('is-valid');
                this.classList.add('is-invalid');
                document.getElementById(errorElementId).style.display = 'block';
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
                document.getElementById(errorElementId).style.display = 'none';
            }
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

window.restrictDateInput = function (input, isBirthDate = false) {
    input.addEventListener('input', function(e) {
        const value = this.value;
        
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        const errorElementId = input.id + 'Error';
        if (value && !dateRegex.test(value)) {
            this.classList.add('is-invalid');
            document.getElementById(errorElementId).style.display = 'block';
        } else {
            const [day, month, year] = value.split('/');
            const date = new Date(year, month - 1, day);
            const currentDate = new Date();
            
            if (isNaN(date.getTime())) {
                this.classList.add('is-invalid');
                document.getElementById(errorElementId).style.display = 'block';
            } else if (isBirthDate && date > currentDate) {
                this.classList.add('is-invalid');
                document.getElementById(errorElementId).style.display = 'block';
            } else {
                this.classList.remove('is-invalid');
                document.getElementById(errorElementId).style.display = 'none';
            }
        }
    });
}
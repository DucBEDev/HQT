function checkPasswords() {
    var password = document.getElementsByName('password')[0].value;
    var repassword = document.getElementsByName('repassword')[0].value;
    var message = document.getElementById('password-message');
    
    if (password === '' || repassword === '') {
        message.style.display = 'none';
    } else if (password === repassword) {
        message.style.display = 'none';
    } else {
        message.style.display = 'block';
        message.innerHTML = '<i class="fas fa-exclamation-circle"></i> Mật khẩu không khớp!';
    }
}
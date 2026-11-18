// Milestone 1: UI interactions only. No credentials are sent or stored.
document.querySelectorAll('[data-toggle-password]').forEach(button => {
  button.addEventListener('click', () => {
    const field = document.getElementById(button.dataset.togglePassword);
    if (!field) return;
    const showing = field.type === 'text';
    field.type = showing ? 'password' : 'text';
    button.textContent = showing ? 'Show' : 'Hide';
    button.setAttribute('aria-pressed', String(!showing));
    button.setAttribute('aria-label', `${showing ? 'Show' : 'Hide'} ${field.id === 'confirm-password' ? 'password confirmation' : 'password'}`);
  });
});

document.querySelectorAll('[data-demo-form]').forEach(form => {
  form.addEventListener('submit', event => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    message.classList.remove('error');
    if (form.dataset.demoForm === 'register') {
      const password = form.querySelector('#password').value;
      const confirm = form.querySelector('#confirm-password').value;
      if (password !== confirm) {
        message.textContent = 'Passwords do not match.';
        message.classList.add('error');
        return;
      }
    }
    message.textContent = 'Front-end demo only. Account functionality will be added in Milestone 2.';
  });
});

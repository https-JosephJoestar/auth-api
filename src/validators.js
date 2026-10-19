const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devuelve una lista de errores. Si la lista está vacía, los datos son válidos.
export function validateRegister({ name, email, password } = {}) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('El email no es válido');
  }
  errors.push(...validatePassword(password));

  return errors;
}

export function validatePassword(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  } else {
    if (!/[A-Za-z]/.test(password)) errors.push('La contraseña debe tener al menos una letra');
    if (!/[0-9]/.test(password)) errors.push('La contraseña debe tener al menos un número');
  }

  return errors;
}

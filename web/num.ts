export function checkAge(age: number) {
  if (age >= 18) {
    return "adult";
  } else {
    return "minor";
  }
}

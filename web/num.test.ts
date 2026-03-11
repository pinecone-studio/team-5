import { checkAge } from "./num";

test("adult age", () => {
  expect(checkAge(20)).toBe("adult");
});

test("minor age", () => {
  expect(checkAge(15)).toBe("minor");
});

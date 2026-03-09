import boot from "#client/boot";
import type { FormInit, FormView } from "#client/create-form";
import createForm from "#client/create-form";
import type Data from "#client/Data";
import navigate from "#client/navigate";
import submit from "#client/submit";
import toValidated from "#client/to-validated";
import validateField from "#client/validate-field";
import type ValidateInit from "#client/ValidateInit";
import type ValidateUpdater from "#client/ValidateUpdater";
import type ValidationError from "#client/ValidationError";

const client = {
  boot,
  navigate: navigate.go,
  submit,
  createForm,
  validateField,
  toValidated,
};

export default client;

export type {
  Data,
  FormInit,
  FormView,
  ValidateInit,
  ValidateUpdater,
  ValidationError,
};


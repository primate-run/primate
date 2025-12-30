import createForm, {
  type FormInit,
  type FormView,
} from "#client/create-form";
import toValidated from "#client/toValidated";
import validateField from "#client/validate-field";
import type ValidateInit from "#client/ValidateInit";
import type ValidateUpdater from "#client/ValidateUpdater";
import type ValidationError from "#client/ValidationError";

const client = {
  createForm,     // headless form controller
  validateField,  // low-level single-value transport
  toValidated,    // adapter to create field stores/hooks
};

export default client;

export type {
  FormInit,
  FormView,
  ValidateInit, ValidateUpdater, ValidationError,
};

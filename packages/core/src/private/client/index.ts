import boot from "#client/boot";
import type {
  ClientMethod,
  FormInit,
  FormView,
  MethodMeta,
} from "#client/create-form";
import createForm from "#client/create-form";
import type Data from "#client/Data";
import navigate from "#client/navigate";
import type Publish from "#client/Publish";
import type Render from "#client/Render";
import submit from "#client/submit";
import toValidated from "#client/to-validated";
import validateField from "#client/validate-field";
import type ValidateInit from "#client/ValidateInit";
import type ValidateUpdater from "#client/ValidateUpdater";
import type ValidationError from "#client/ValidationError";
import type ViewResponse from "#client/ViewResponse";

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
  ClientMethod, Data,
  FormInit,
  FormView, MethodMeta, Publish,
  Render,
  ValidateInit,
  ValidateUpdater,
  ValidationError,
  ViewResponse
};


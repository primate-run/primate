import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="email" placeholder="Email">
      @if (form.get('email')?.invalid && form.get('email').touched)) {
        <div>Email is required and must be valid</div>
      }

      <input formControlName="password" type="password" placeholder="Password">
      @if (form.get('password')?.invalid && form.get('password').touched)) {
        <div>Password must be at least 8 characters</div>
      }

      <button type="submit" [disabled]="!form.valid">Submit</button>
    </form>
  `,
})
export default class LoginForm {
  fb = inject(FormBuilder);
  form = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(8)]],
  });

  async onSubmit() {
    if (!this.form.valid) return;

    await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.form.value),
    });
  }
}

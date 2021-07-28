import { FormGroup } from "@angular/forms";
import { parse as dateParse } from "date-fns";
// custom validator to check that two fields match
export function DateValidator(
    startTimeControlName: string,
    endTimeControlName: string
) {
    return (formGroup: FormGroup) => {
        const control = formGroup.controls[startTimeControlName];
        const matchingControl = formGroup.controls[endTimeControlName];

        if (matchingControl.errors && !matchingControl.errors.BiggerMatch) {
            // return if another validator has already found an error on the matchingControl
            return;
        }
        let startDate = dateParse(control.value, 'hh:mm a', new Date());
        let endDate = dateParse(matchingControl.value, 'hh:mm a', new Date());
        // set error on matchingControl if validation fails
        if (startDate >= endDate) {
            matchingControl.setErrors({ BiggerMatch: true });
        } else {
            matchingControl.setErrors(null);
        }
    };
}
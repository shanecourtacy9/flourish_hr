import { FormGroup } from "@angular/forms"

/**
 * 
 * @param f 
 * @param fields 
 */
let enableVideoFormFields = (form: FormGroup, fields: any) => {
  if (!fields.length) return
  fields.forEach(field => {
    form.controls[field].enable()
  })
}

/**
 * 
 * @param form 
 * @param commonFields 
 */
let getFormsFields = (form: FormGroup, commonFields:string[]) => {
  if(!commonFields.length) return
  Object.keys(form.controls).forEach(field => {
    if (!commonFields.includes(field)) {
      form.controls[field].disable()
    }
  })
}
export const ManageForm = {
  enableVideoFormFields,
  getFormsFields
}


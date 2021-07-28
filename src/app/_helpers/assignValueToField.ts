//assign value to fields of form
export class ValueAssigner {
    private assignStrategy: any
    private isAddMode: boolean
    constructor(isAddMode) {
        this.isAddMode = isAddMode;
        if (this.isAddMode) {
            this.assignStrategy = addModeAssigner
        } else {
            this.assignStrategy = editModeAssigner
        }

    }
    assignValueToField(formControls, field: String, valueList: Array<any>, currentObject: any) {
        this.assignStrategy
        .assignValueToField(formControls, field, valueList, currentObject)
    }
}


const addModeAssigner = {
    assignValueToField: (formControls, field, valueList, currentObject) => {
        if(valueList[0]&& valueList[0].hasOwnProperty('_id')){
            formControls[field].patchValue(valueList[0]._id)
        }else{
            formControls[field].patchValue('')
        }
        
    }
}

const editModeAssigner = {
    assignValueToField: (formControls, field, valueList, currentObject) => {
        let fieldValueObject = valueList.find(valueItem => {
            return valueItem._id === currentObject[field]
        })
        if (fieldValueObject) {
            formControls[field].patchValue(fieldValueObject._id)
        } else {
            formControls[field].patchValue(valueList[0]._id)
        }
    }
}  
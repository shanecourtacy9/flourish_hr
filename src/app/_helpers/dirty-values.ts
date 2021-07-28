export const DirtyValues = {
   getDirtyValues(controlGroups) {
      let dirtyValues = {};  // initialize empty object
      Object.keys(controlGroups.controls).forEach((c) => {
         let currentControl = controlGroups.get(c);
         if (currentControl.dirty) {
            if (currentControl.controls) //check for nested controlGroups
               dirtyValues[c] = this.get_dirty_values(currentControl);  //recursion for nested controlGroups
            else
               dirtyValues[c] = currentControl.value;  //simple control
         }
      });
      return dirtyValues;
   }
}
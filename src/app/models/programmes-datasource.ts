//programme data source class
import { Observable } from 'rxjs';
import { ProgrammesService } from "../services";
export class ProgrammesDatasource {
    constructor(private programmesService:ProgrammesService){}
    getProgrammes(startDate,endDate,sortOrder,pageNumber,pageSize):Observable<any>{
        return this.programmesService.getProgrammes(startDate,endDate,sortOrder,pageNumber,pageSize)
    }
}
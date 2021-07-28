//user data sources
import { Observable } from 'rxjs';
import { UsersService } from "../services";
export class UsersDatasource {
    constructor(private usersService:UsersService){}
    getUsers(filter,sortOrder,pageNumber,pageSize):Observable<any>{
        return this.usersService.getUsers(filter,sortOrder,pageNumber,pageSize)
    }
}
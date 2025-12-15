import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map } from 'rxjs';
import { BranchesTs } from '../types/branches';

@Injectable({
  providedIn: 'root',
})
export class BranchServ {
  http = inject(HttpClient);
  apidata = 'http://localhost:5062/api/Branches';

  getBranches() {
    return this.http.get<BranchesTs[]>(this.apidata).pipe(
      map((res) => {
        return res;
      }),
      catchError((err: any) => {
        alert(err.message);
        return [];
      })
    );
  }
}

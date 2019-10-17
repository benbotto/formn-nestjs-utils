import { Validate, NotNullValidator, IntValidator, JSONObjectValidator } from 'bsy-validation';

import { FormnConditionValidator } from './formn-condition-validator';
import { ParameterTypeValidator } from './parameter-type-validator';

export class SearchQuery {
  @Validate(
    new NotNullValidator(),
    new IntValidator())
  offset: number;

  @Validate(
    new NotNullValidator(),
    new IntValidator())
  rowCount: number;

  @Validate(
    new NotNullValidator(),
    new JSONObjectValidator(),
    new FormnConditionValidator())
  cond: object;

  @Validate(
    new NotNullValidator(),
    new JSONObjectValidator(),
    new ParameterTypeValidator())
  params: object;
}

import { AppError } from '../_shared/errors';

/** Erreurs métier du graphe familial : codes stables, statut 422 (écriture refusée). */
abstract class FamilyRuleError extends AppError {
  constructor(code: string, message: string) {
    super({ message, code, status: 422 });
  }
}

export class CycleError extends FamilyRuleError {
  constructor(parentId: string, childId: string) {
    super('FAMILY_CYCLE', `${parentId} ne peut pas être parent de ${childId} : cela crée un cycle`);
    this.name = 'CycleError';
  }
}

export class TooManyBiologicalParentsError extends FamilyRuleError {
  constructor(childId: string) {
    super('FAMILY_TOO_MANY_BIOLOGICAL_PARENTS', `${childId} a déjà deux parents biologiques`);
    this.name = 'TooManyBiologicalParentsError';
  }
}

export class InconsistentDatesError extends FamilyRuleError {
  constructor(message: string) {
    super('FAMILY_INCONSISTENT_DATES', message);
    this.name = 'InconsistentDatesError';
  }
}

export class SelfUnionError extends FamilyRuleError {
  constructor(personId: string) {
    super('FAMILY_SELF_UNION', `${personId} ne peut pas former une union avec lui-même`);
    this.name = 'SelfUnionError';
  }
}

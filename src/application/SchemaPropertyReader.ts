export interface CircuitProperties {
  readonly itemId: number;
  readonly nameMode: string;
  readonly name: string;
  readonly protection: string;
  readonly poleCount: string;
  readonly amperage: string;
  readonly differentialCurrent: string;
  readonly differentialType: string;
  readonly breakerCurve: string;
  readonly shortCircuitRating: string;
  readonly selectiveDifferential: boolean;
  readonly phase: string;
  readonly normallyClosed: boolean;
  readonly control: string;
  readonly hasCable: boolean;
  readonly cableType: string;
  readonly cableLocation: string;
  readonly cableInConduit: boolean;
  readonly residential: boolean;
  readonly address: string;
  readonly text: string;
  readonly startsNewPage: boolean;
  readonly canStartNewPage: boolean;
}

export type CircuitPropertyChanges = Partial<Omit<CircuitProperties,
  "itemId" | "canStartNewPage"
>>;

/** Read-only, UI-independent projection for gradually migrated property editors. */
export interface SchemaPropertyReader {
  getCircuit(itemId: number): CircuitProperties | undefined;
}

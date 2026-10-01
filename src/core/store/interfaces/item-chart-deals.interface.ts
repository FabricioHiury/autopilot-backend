export interface IItemChartOriginDeals {
  data: string;
  count: ICountOriginDeals;
}

export interface ICountOriginDeals {
  ads?: number;
  store?: number;
  networksSocial?: number;
  mediaIndividual?: number;
  other?: number;
}

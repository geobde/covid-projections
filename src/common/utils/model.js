import * as moment from 'moment';
import { useState, useEffect } from 'react';
import { Projections } from '../models/Projections';
import { STATES, REVERSED_STATES, INTERVENTIONS } from '..';
import fetch from 'node-fetch';
import {
  RegionAggregateDescriptor,
  RegionDescriptor,
} from './RegionDescriptor';
import { Api } from 'api';

export async function fetchProjections(stateId, countyInfo = null) {
  let region;
  if (countyInfo) {
    region = RegionDescriptor.forCounty(countyInfo.full_fips_code);
  } else {
    region = RegionDescriptor.forState(stateId);
  }
  const summaryWithTimeseriesMap = await new Api().fetchSummaryWithTimeseriesMap(
    region,
  );
  return new Projections(summaryWithTimeseriesMap, stateId, countyInfo);
}

/** Returns an array of `Projections` instances for all states. */
export async function fetchAllStateProjections(snapshotUrl = null) {
  const all = await new Api(
    snapshotUrl,
  ).fetchAggregatedSummaryWithTimeseriesMaps(
    RegionAggregateDescriptor.STATES,
    snapshotUrl,
  );
  return all.map(summaryWithTimeseriesMap => {
    // We grab the state from an arbitrary intervention's summary data.
    const stateName =
      summaryWithTimeseriesMap[INTERVENTIONS.LIMITED_ACTION].stateName;
    return new Projections(
      summaryWithTimeseriesMap,
      REVERSED_STATES[stateName],
    );
  });
}

/** Returns an array of `Projections` instances for all counties. */
export async function fetchAllCountyProjections() {
  const all = await new Api().fetchAggregatedSummaryWithTimeseriesMaps(
    RegionAggregateDescriptor.COUNTIES,
  );
  return all.map(summaryWithTimeseriesMap => {
    // We grab the state / fips from an arbitrary intervention's summary data.
    const stateName =
      summaryWithTimeseriesMap[INTERVENTIONS.LIMITED_ACTION].stateName;
    const fips = summaryWithTimeseriesMap[INTERVENTIONS.LIMITED_ACTION].fips;
    return new Projections(
      summaryWithTimeseriesMap,
      REVERSED_STATES[stateName],
      fips,
    );
  });
}

export function useProjections(location, county = null) {
  const [projections, setProjections] = useState();

  useEffect(() => {
    async function fetchData() {
      const projections = await fetchProjections(location, county);
      setProjections(projections);
    }
    fetchData();
  }, [location, county]);

  return projections;
}

export function useAllStateProjections(snapshotUrl = null) {
  const [stateModels, setStateModels] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const states = Object.keys(STATES);
      const stateProjectionPromises = states.map(state =>
        fetchProjections(state, null, snapshotUrl),
      );
      const stateProjections = await Promise.all(stateProjectionPromises);
      const _stateModels = {};
      states.forEach((state, idx) => {
        _stateModels[state] = stateProjections[idx];
      });
      setStateModels(_stateModels);
    }
    fetchData();
  }, [snapshotUrl]);

  return stateModels;
}

export function useModelLastUpdatedDate() {
  const [lastUpdated, setLastUpdated] = useState(null);
  useEffect(() => {
    new Api().fetchVersionTimestamp().then(timestamp => {
      // We add 1 day since models are generally published the day after
      // they're generated (due to QA process).
      let date = moment(timestamp).add(1, 'day');
      // But we don't want to accidentally show a future date.
      date = moment().diff(date) < 0 ? moment() : date;
      setLastUpdated(date.toDate());
    });
  }, []);

  return lastUpdated;
}

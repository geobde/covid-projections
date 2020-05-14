import _ from 'lodash';
import React, { useState } from 'react';
import { get } from 'lodash';
import { useHistory } from 'react-router-dom';
import LazyLoad, { forceCheck } from 'react-lazyload';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import moment from 'moment';
import * as QueryString from 'query-string';
import { assert } from 'common/utils';
import { ZoneChartWrapper } from 'components/Charts/ZoneChart.style';
import Chart from 'components/Charts/Chart';
import { getChartData } from 'components/LocationPage/ChartsHolder';
import {
  optionsRt,
  optionsHospitalUsage,
  optionsPositiveTests,
} from 'components/Charts/zoneUtils';

import { STATES } from 'common';
import { useAllStateProjections } from 'common/utils/model';
import DataUrlJson from 'assets/data/data_url.json';
import {
  Wrapper,
  ComparisonControlsContainer,
  ModelSelectorContainer,
  ModelComparisonsContainer,
} from './CompareModels.style';
import { Metric } from 'common/metric';

const SORT_TYPES = {
  ALPHABETICAL: 0,
  SERIES_DIFF: 1,
  METRIC_DIFF: 2,
};

// const STATES = { 'WA': 'Washington', 'AK': 'Alaska' };

export function CompareModels({ match, location }) {
  const history = useHistory();

  const params = QueryString.parse(history.location.search);

  // NOTE: The actual website doesn't handle CORS
  // requests so we have to hit the S3 buckets for now.
  const [leftUrl, setLeftUrl] = useState(
    get(
      params,
      'left',
      // TODO(michael): Fetch from
      // https://raw.githubusercontent.com/covid-projections/covid-projections/master/src/assets/data/data_url.json
      // or something.
      'https://data.covidactnow.org/snapshot/276/',
    ),
  );
  const [rightUrl, setRightUrl] = useState(
    get(params, 'right', DataUrlJson.data_url),
  );

  const icu = get(params, 'icu') || false;

  // Load models for all states.
  const leftProjectionDatas = useAllStateProjections(leftUrl);
  const rightProjectionDatas = useAllStateProjections(rightUrl);

  const leftProjections = {},
    rightProjections = {};
  const states = Object.keys(STATES);

  if (leftProjectionDatas && rightProjectionDatas) {
    for (const state of states) {
      try {
        leftProjections[state] = leftProjectionDatas[state];
      } catch (err) {
        console.log('Left models invalid:', err);
      }

      try {
        rightProjections[state] = rightProjectionDatas[state];
      } catch (err) {
        console.log('Right model invalid:', err);
      }
    }
  }

  // We have separate state for the input field text
  // because we don't want to actually update our
  // URLs (and reload all the charts) until the
  // input field loses focus (onBlur).
  const [leftText, setLeftText] = useState(leftUrl);
  const [rightText, setRightText] = useState(rightUrl);

  // We need to let you force a refresh because you may
  // be pointing at model files on a localhost
  // webserver that have changed since the page was loaded.
  const [refreshing, setRefreshing] = useState(false);

  const [sortType, setSortType] = useState(SORT_TYPES.SERIES_DIFF);

  const metric = icu ? Metric.HOSPITAL_USAGE : Metric.CASE_GROWTH_RATE;

  const sortFunctionMap = {
    [SORT_TYPES.ALPHABETICAL]: sortAlphabetical,
    [SORT_TYPES.SERIES_DIFF]: sortBySeriesDiff,
    [SORT_TYPES.METRIC_DIFF]: sortByMetricDiff,
  };

  function sortAlphabetical(a, b) {
    return a < b ? -1 : 1;
  }

  function sortBySeriesDiff(stateA, stateB) {
    const diffA = getSeriesDiffForState(stateA);
    const diffB = getSeriesDiffForState(stateB);
    if (diffA === diffB) {
      return 0;
    }
    return diffA > diffB ? -1 : 1;
  }

  function getSeriesDiffForState(stateAbbr) {
    if (!leftProjections[stateAbbr] || !rightProjections[stateAbbr]) {
      return 0;
    }
    const getDataset = projection => {
      return metric === Metric.HOSPITAL_USAGE
        ? projection.getDataset('icuUtilization')
        : projection.getDataset('rtRange').map(d => ({ x: d.x, y: d.y?.rt }));
    };

    const leftDataset = getDataset(leftProjections[stateAbbr].primary);
    const rightDataset = getDataset(rightProjections[stateAbbr].primary);
    const [left, right] = trimDatasetsToMatch(leftDataset, rightDataset);
    assert(left.length === right.length, `Datasets should match`);
    const length = left.length;

    // TODO(michael): Figure out how to incorporate missing data points.
    const min = Math.min(_.minBy(left, d => d.y).y, _.minBy(right, d => d.y).y);
    const max = Math.max(_.maxBy(left, d => d.y).y, _.maxBy(right, d => d.y).y);
    const range = max - min;
    /*
    const leftPoints = _.filter(leftDataset, d => d.y != null).length;
    const rightPoints = _.filter(rightDataset, d => d.y != null).length;
    const missingPointsSquareDiffs = Math.abs(leftPoints - rightPoints) * (range*range)
    */

    let sumSquareDiffs = 0;
    for (let i = 0; i < length; i++) {
      if ((left[i].y == null) !== (right[i].y == null)) {
        // TODO(michael): Figure out how to deal with missing data points.
        sumSquareDiffs += range * range;
      }
      const diff = left[i].y - right[i].y;
      sumSquareDiffs += diff * diff;
    }
    const rmsd = Math.sqrt(sumSquareDiffs / length);
    return rmsd;
  }

  function trimDatasetsToMatch(left, right) {
    const startTime = Math.max(
      _.find(left, d => d.y != null).x,
      _.find(right, d => d.y != null).x,
    );
    const endTime = Math.min(
      _.findLast(left, d => d.y != null).x,
      _.findLast(right, d => d.y != null).x,
    );

    const leftStartIndex = _.findIndex(left, d => d.x == startTime);
    const rightStartIndex = _.findIndex(right, d => d.x == startTime);
    const leftEndIndex = _.findIndex(left, d => d.x == endTime);
    const rightEndIndex = _.findIndex(right, d => d.x == endTime);

    return [
      left.slice(leftStartIndex, leftEndIndex + 1),
      right.slice(rightStartIndex, rightEndIndex + 1),
    ];
  }

  function sortByMetricDiff(stateA, stateB) {
    const diffA = getMetricDiffForState(stateA);
    const diffB = getMetricDiffForState(stateB);
    if (diffA === diffB) {
      return 0;
    }
    return diffA > diffB ? -1 : 1;
  }

  function getMetricDiffForState(stateAbbr) {
    const getMetric = projection => {
      return metric === Metric.HOSPITAL_USAGE
        ? projection.currentIcuUtilization
        : projection.rt;
    };

    const left = getMetric(leftProjections[stateAbbr].primary);
    const right = getMetric(rightProjections[stateAbbr].primary);
    return Math.abs(left - right);
  }

  function setQueryParams(leftText, rightText) {
    const params = {
      left: leftText,
      right: rightText,
    };

    history.push({
      ...location,
      search: QueryString.stringify(params),
    });
  }

  function refresh() {
    setLeftUrl(leftText);
    setRightUrl(rightText);
    setQueryParams(leftText, rightText);
    setRefreshing(true);
  }

  if (refreshing) {
    setTimeout(() => setRefreshing(false), 0);
  }

  const changeSort = event => {
    setSortType(event.target.value);
  };

  // HACK: When we re-sort, etc. LazyLoad doesn't notice that it may be visible.
  setTimeout(() => forceCheck(), 50);

  return (
    <Wrapper>
      <ModelSelectorContainer>
        <FormControl style={{ width: '35rem', marginRight: '1rem' }}>
          <TextField
            id="compare-left"
            label="Model Data URL (Left)"
            value={leftText}
            onChange={e => setLeftText(e.target.value)}
            onBlur={() => refresh()}
            onKeyPress={ev => {
              if (ev.key === 'Enter') {
                refresh();
                ev.preventDefault();
              }
            }}
          />
        </FormControl>
        <FormControl style={{ width: '35rem' }}>
          <TextField
            id="compare-right"
            label="Model Data URL (Right)"
            value={rightText}
            onChange={e => setRightText(e.target.value)}
            onBlur={() => refresh()}
            onKeyPress={ev => {
              if (ev.key === 'Enter') {
                refresh();
                ev.preventDefault();
              }
            }}
          />
        </FormControl>
        <Button variant="contained" onClick={() => refresh()}>
          Refresh
        </Button>
        <div style={{ fontSize: 'small', marginTop: '0.5rem' }}>
          Enter URLs pointing to .json model files. To test against local model
          files, run an http server from e.g. covid-data-model/results/test/.
          <br />
          Node HTTP server:{' '}
          <code style={{ backgroundColor: '#f0f0f0' }}>
            npx http-server --cors
          </code>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <a href="https://stackoverflow.com/questions/21956683/enable-access-control-on-simple-http-server">
            Python HTTP Server
          </a>
        </div>
        <ComparisonControlsContainer>
          <FormControl style={{ width: '12rem' }}>
            <InputLabel focused={false}>Sort by:</InputLabel>
            <Select value={sortType} onChange={changeSort}>
              <MenuItem value={SORT_TYPES.SERIES_DIFF}>Series Diff</MenuItem>
              <MenuItem value={SORT_TYPES.METRIC_DIFF}>Metric Diff</MenuItem>
              <MenuItem value={SORT_TYPES.ALPHABETICAL}>State Name</MenuItem>
            </Select>
          </FormControl>
        </ComparisonControlsContainer>
      </ModelSelectorContainer>

      <StateComparisonList
        states={states.sort(sortFunctionMap[sortType])}
        metric={metric}
        leftProjections={leftProjections}
        rightProjections={rightProjections}
        refreshing={refreshing}
      />
    </Wrapper>
  );
}

const StateComparisonList = function ({
  states,
  metric,
  leftProjections,
  rightProjections,
  refreshing,
}) {
  if (
    !Object.keys(leftProjections).length &&
    !Object.keys(rightProjections).length
  ) {
    return <div>Loading...</div>;
  }

  return (
    <ModelComparisonsContainer>
      {states.map(state => (
        <StateCompare
          key={state}
          state={state}
          metric={metric}
          leftProjections={leftProjections[state]}
          rightProjections={rightProjections[state]}
          refreshing={refreshing}
        />
      ))}
    </ModelComparisonsContainer>
  );
};

function StateCompare({
  state,
  metric,
  leftProjections,
  rightProjections,
  refreshing,
}) {
  return (
    <>
      <hr />
      <h2>{STATES[state]}</h2>
      {!refreshing && (
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <StateChart
              state={state}
              metric={metric}
              projections={leftProjections}
            />
          </Grid>
          <Grid item xs={6}>
            <StateChart
              state={state}
              metric={metric}
              projections={rightProjections}
            />
          </Grid>
        </Grid>
      )}
    </>
  );
}

function StateChart({ state, metric, projections }) {
  const locationName = STATES[state];

  if (!projections) {
    return <div>Failed to load data for {locationName}</div>;
  }

  const { rtRangeData, testPositiveData, icuUtilizationData } = getChartData(
    projections.primary,
  );

  return (
    // Chart height is 600px; we pre-load when a chart is within 1200px of view.
    <LazyLoad height={400} offset={800}>
      {metric === Metric.CASE_GROWTH_RATE && rtRangeData && (
        <ZoneChartWrapper style={{ marginLeft: '25px' }}>
          <Chart options={optionsRt(rtRangeData)} />
        </ZoneChartWrapper>
      )}
      {metric === Metric.HOSPITAL_USAGE && icuUtilizationData && (
        <ZoneChartWrapper style={{ marginLeft: '25px' }}>
          <Chart options={optionsHospitalUsage(icuUtilizationData)} />
        </ZoneChartWrapper>
      )}
    </LazyLoad>
  );
}

export default CompareModels;

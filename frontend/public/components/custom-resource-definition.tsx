import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { BanIcon } from '@patternfly/react-icons';

import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  AsyncComponent,
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import { K8sResourceKind, referenceForCRD, CustomResourceDefinitionKind } from '../module/k8s';
import { CustomResourceDefinitionModel } from '../models';
import { resourceListPages } from './resource-pages';
import { DefaultPage } from './default-resource';
import { GreenCheckCircleIcon } from '@console/shared';

const { common } = Kebab.factory;

const crdInstancesPath = (crd) =>
  _.get(crd, 'spec.scope') === 'Namespaced'
    ? `/k8s/all-namespaces/${referenceForCRD(crd)}`
    : `/k8s/cluster/${referenceForCRD(crd)}`;

const instances = (kind, obj) => ({
  label: 'View Instances',
  href: crdInstancesPath(obj),
});

const menuActions = [
  instances,
  ...Kebab.getExtensionsActionsForKind(CustomResourceDefinitionModel),
  ...common,
];

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const CRDTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'spec.names.kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Group',
      sortField: 'spec.group',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Version',
      sortField: 'spec.version',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Namespaced',
      sortField: 'spec.scope',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Established',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
CRDTableHeader.displayName = 'CRDTableHeader';

const isEstablished = (conditions) => {
  const condition = _.find(conditions, (c) => c.type === 'Established');
  return condition && condition.status === 'True';
};

const namespaced = (crd) => crd.spec.scope === 'Namespaced';

const CRDTableRow: React.FC<CRDTableRowProps> = ({ obj: crd, index, key, style }) => {
  return (
    <TableRow id={crd.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <span className="co-resource-item">
          <ResourceLink
            kind="CustomResourceDefinition"
            name={crd.metadata.name}
            namespace={crd.metadata.namespace}
            displayName={_.get(crd, 'spec.names.kind')}
          />
        </span>
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {crd.spec.group}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{crd.spec.version}</TableData>
      <TableData className={tableColumnClasses[3]}>{namespaced(crd) ? 'Yes' : 'No'}</TableData>
      <TableData className={tableColumnClasses[4]}>
        {isEstablished(crd.status.conditions) ? (
          <span>
            <GreenCheckCircleIcon />
          </span>
        ) : (
          <span>
            <BanIcon />
          </span>
        )}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind="CustomResourceDefinition" resource={crd} />
      </TableData>
    </TableRow>
  );
};
CRDTableRow.displayName = 'CRDTableRow';
type CRDTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

const Details = ({ obj: crd }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Custom Resource Definition Overview" />
      <ResourceSummary showPodSelector={false} showNodeSelector={false} resource={crd} />
    </div>
  );
};

const Instances: React.FC<InstancesProps> = ({ obj, namespace }) => {
  const crdKind = referenceForCRD(obj);
  const componentLoader = resourceListPages.get(crdKind, () => Promise.resolve(DefaultPage));
  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={namespace ? namespace : undefined}
      kind={crdKind}
      showTitle={false}
      autoFocus={false}
    />
  );
};

export const CustomResourceDefinitionsList: React.FC<CustomResourceDefinitionsListProps> = (
  props,
) => (
  <Table
    {...props}
    aria-label="Custom Resource Definitions"
    Header={CRDTableHeader}
    Row={CRDTableRow}
    defaultSortField="spec.names.kind"
    virtualize
  />
);

export const CustomResourceDefinitionsPage: React.FC<CustomResourceDefinitionsPageProps> = (
  props,
) => (
  <ListPage
    {...props}
    ListComponent={CustomResourceDefinitionsList}
    kind="CustomResourceDefinition"
    canCreate={true}
  />
);
export const CustomResourceDefinitionsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[
      navFactory.details(Details),
      navFactory.editYaml(),
      { name: 'Instances', href: 'instances', component: Instances },
    ]}
  />
);

export type CustomResourceDefinitionsListProps = {};

export type CustomResourceDefinitionsPageProps = {};

type InstancesProps = {
  obj: CustomResourceDefinitionKind;
  namespace: string;
};

CustomResourceDefinitionsList.displayName = 'CustomResourceDefinitionsList';
CustomResourceDefinitionsPage.displayName = 'CustomResourceDefinitionsPage';

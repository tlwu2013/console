import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { getName, getMachineNode, createLookup } from '@console/shared';
import { MachineModel, NodeModel } from '@console/internal/models';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { BareMetalHostModel, NodeMaintenanceModel } from '../../models';
import { getHostMachine, getNodeMaintenanceNodeName } from '../../selectors';
import { getHostStatus } from '../../utils/host-status';
import { HostRowBundle } from '../types';
import { hostStatusFilter } from './table-filters';
import BareMetalHostsTable from './BareMetalHostsTable';

const flattenResources = (resources) => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(resources, (resource) =>
    resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
  );
  const {
    hosts: { data: hostsData },
    machines: { data: machinesData },
    nodes: { data: nodesData },
    nodeMaintenances,
  } = resources;

  if (loaded) {
    const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);

    return hostsData.map(
      (host): HostRowBundle => {
        const machine = getHostMachine(host, machinesData);
        const node = getMachineNode(machine, nodesData);
        const nodeMaintenance = maintenancesByNodeName[getName(node)];
        const status = getHostStatus({ host, machine, node, nodeMaintenance });
        // TODO(jtomasek): metadata.name is needed to make 'name' textFilter work.
        // Remove it when it is possible to pass custom textFilter as a function
        return { metadata: { name: getName(host) }, host, machine, node, nodeMaintenance, status };
      },
    );
  }
  return [];
};

type BareMetalHostsPageProps = {
  namespace: string;
  hasNodeMaintenanceCapability: boolean;
};

const BareMetalHostsPage: React.FC<BareMetalHostsPageProps> = ({
  hasNodeMaintenanceCapability,
  ...props
}) => {
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(BareMetalHostModel),
      namespaced: true,
      prop: 'hosts',
    },
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      prop: 'machines',
    },
    {
      kind: NodeModel.kind,
      namespaced: false,
      prop: 'nodes',
    },
  ];

  if (hasNodeMaintenanceCapability) {
    resources.push({
      kind: referenceForModel(NodeMaintenanceModel),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  const createHostProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/${referenceForModel(
      BareMetalHostModel,
    )}/~new/form`,
  };

  return (
    <MultiListPage
      {...props}
      canCreate
      rowFilters={[hostStatusFilter]}
      createProps={createHostProps}
      createButtonText="Add Host"
      namespace={props.namespace}
      resources={resources}
      flatten={flattenResources}
      ListComponent={BareMetalHostsTable}
      customData={{ hasNodeMaintenanceCapability }}
      title="Bare Metal Hosts"
    />
  );
};

const mapStateToProps = ({ k8s }) => ({
  hasNodeMaintenanceCapability: !!k8s.getIn([
    'RESOURCES',
    'models',
    referenceForModel(NodeMaintenanceModel),
  ]),
});

export default connect(mapStateToProps)(BareMetalHostsPage);

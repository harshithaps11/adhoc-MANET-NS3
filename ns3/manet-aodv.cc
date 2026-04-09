#include "ns3/aodv-helper.h"
#include "ns3/applications-module.h"
#include "ns3/core-module.h"
#include "ns3/flow-monitor-helper.h"
#include "ns3/internet-module.h"
#include "ns3/ipv4-flow-classifier.h"
#include "ns3/mobility-module.h"
#include "ns3/netanim-module.h"
#include "ns3/network-module.h"
#include "ns3/wifi-module.h"

using namespace ns3;

NS_LOG_COMPONENT_DEFINE("ManetAodvDemo");

int main(int argc, char *argv[])
{
    uint32_t nNodes = 20;
    double simTime = 60.0;
    double txRange = 120.0;
    double nodeSpeed = 10.0;
    uint32_t packetSize = 512;
    std::string dataRate = "256kbps";

    CommandLine cmd(__FILE__);
    cmd.AddValue("nNodes", "Number of MANET nodes", nNodes);
    cmd.AddValue("simTime", "Simulation time in seconds", simTime);
    cmd.AddValue("txRange", "Approx transmission range in meters", txRange);
    cmd.AddValue("nodeSpeed", "Node speed in m/s", nodeSpeed);
    cmd.AddValue("packetSize", "UDP packet size in bytes", packetSize);
    cmd.AddValue("dataRate", "OnOff application data rate", dataRate);
    cmd.Parse(argc, argv);

    NodeContainer nodes;
    nodes.Create(nNodes);

    YansWifiChannelHelper channel = YansWifiChannelHelper::Default();
    channel.AddPropagationLoss("ns3::RangePropagationLossModel", "MaxRange", DoubleValue(txRange));

    YansWifiPhyHelper phy;
    phy.SetChannel(channel.Create());

    WifiMacHelper mac;
    mac.SetType("ns3::AdhocWifiMac");

    WifiHelper wifi;
    wifi.SetStandard(WIFI_STANDARD_80211g);
    wifi.SetRemoteStationManager("ns3::ConstantRateWifiManager",
                                 "DataMode", StringValue("ErpOfdmRate24Mbps"),
                                 "ControlMode", StringValue("ErpOfdmRate6Mbps"));

    NetDeviceContainer devices = wifi.Install(phy, mac, nodes);

    MobilityHelper mobility;
    Ptr<ListPositionAllocator> positionAlloc = CreateObject<ListPositionAllocator>();

    uint32_t gridWidth = std::ceil(std::sqrt(nNodes));
    double spacing = 50.0;
    for (uint32_t i = 0; i < nNodes; ++i)
    {
        double x = (i % gridWidth) * spacing;
        double y = (i / gridWidth) * spacing;
        positionAlloc->Add(Vector(x, y, 0.0));
    }

    mobility.SetPositionAllocator(positionAlloc);
    mobility.SetMobilityModel("ns3::RandomWaypointMobilityModel",
                              "Speed", StringValue("ns3::ConstantRandomVariable[Constant=" + std::to_string(nodeSpeed) + "]"),
                              "Pause", StringValue("ns3::ConstantRandomVariable[Constant=0.5]"),
                              "PositionAllocator", PointerValue(positionAlloc));
    mobility.Install(nodes);

    AodvHelper aodv;
    InternetStackHelper internet;
    internet.SetRoutingHelper(aodv);
    internet.Install(nodes);

    Ipv4AddressHelper ipv4;
    ipv4.SetBase("10.1.0.0", "255.255.0.0");
    Ipv4InterfaceContainer interfaces = ipv4.Assign(devices);

    uint16_t port = 9999;
    uint32_t sourceNode = 0;
    uint32_t sinkNode = nNodes - 1;

    // Export XML animation trace for NetAnim visualization.
    AnimationInterface anim("manet-aodv.xml");
    anim.EnablePacketMetadata(true);
    anim.EnableIpv4RouteTracking("manet-aodv-routes.xml", Seconds(0), Seconds(simTime), Seconds(1.0));

    Address sinkAddress(InetSocketAddress(interfaces.GetAddress(sinkNode), port));

    PacketSinkHelper sinkHelper("ns3::UdpSocketFactory", InetSocketAddress(Ipv4Address::GetAny(), port));
    ApplicationContainer sinkApp = sinkHelper.Install(nodes.Get(sinkNode));
    sinkApp.Start(Seconds(1.0));
    sinkApp.Stop(Seconds(simTime));

    OnOffHelper onOff("ns3::UdpSocketFactory", sinkAddress);
    onOff.SetAttribute("DataRate", DataRateValue(DataRate(dataRate)));
    onOff.SetAttribute("PacketSize", UintegerValue(packetSize));
    onOff.SetAttribute("OnTime", StringValue("ns3::ConstantRandomVariable[Constant=1]"));
    onOff.SetAttribute("OffTime", StringValue("ns3::ConstantRandomVariable[Constant=0]"));

    ApplicationContainer sourceApp = onOff.Install(nodes.Get(sourceNode));
    sourceApp.Start(Seconds(2.0));
    sourceApp.Stop(Seconds(simTime - 1.0));

    FlowMonitorHelper flowHelper;
    Ptr<FlowMonitor> monitor = flowHelper.InstallAll();

    Simulator::Stop(Seconds(simTime));
    Simulator::Run();

    monitor->CheckForLostPackets();
    Ptr<Ipv4FlowClassifier> classifier = DynamicCast<Ipv4FlowClassifier>(flowHelper.GetClassifier());
    std::map<FlowId, FlowMonitor::FlowStats> stats = monitor->GetFlowStats();

    uint64_t txPackets = 0;
    uint64_t rxPackets = 0;
    uint64_t rxBytes = 0;
    double totalDelaySeconds = 0.0;

    for (const auto &entry : stats)
    {
        Ipv4FlowClassifier::FiveTuple tuple = classifier->FindFlow(entry.first);
        if (tuple.destinationAddress == interfaces.GetAddress(sinkNode) && tuple.destinationPort == port)
        {
            const auto &flow = entry.second;
            txPackets += flow.txPackets;
            rxPackets += flow.rxPackets;
            rxBytes += flow.rxBytes;
            totalDelaySeconds += flow.delaySum.GetSeconds();
        }
    }

    double pdr = txPackets > 0 ? (100.0 * static_cast<double>(rxPackets) / static_cast<double>(txPackets)) : 0.0;
    double throughputKbps = (simTime > 0.0) ? (static_cast<double>(rxBytes) * 8.0) / (simTime * 1000.0) : 0.0;
    double avgDelayMs = rxPackets > 0 ? (totalDelaySeconds * 1000.0 / static_cast<double>(rxPackets)) : 0.0;

    std::cout << "\n====== MANET AODV Simulation Results ======\n";
    std::cout << "Nodes               : " << nNodes << "\n";
    std::cout << "Simulation Time (s) : " << simTime << "\n";
    std::cout << "Transmission Range  : " << txRange << " m\n";
    std::cout << "Node Speed          : " << nodeSpeed << " m/s\n";
    std::cout << "Source -> Sink      : Node " << sourceNode << " -> Node " << sinkNode << "\n";
    std::cout << "Tx Packets          : " << txPackets << "\n";
    std::cout << "Rx Packets          : " << rxPackets << "\n";
    std::cout << "PDR (%)             : " << pdr << "\n";
    std::cout << "Throughput (Kbps)   : " << throughputKbps << "\n";
    std::cout << "Avg Delay (ms)      : " << avgDelayMs << "\n";
    std::cout << "===========================================\n";

    Simulator::Destroy();
    return 0;
}

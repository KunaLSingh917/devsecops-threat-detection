const express = require("express");
const k8s = require("@kubernetes/client-node");
const app = express();

const PORT = 3000;

const kc = new k8s.KubeConfig();

try {
    kc.loadFromCluster();
} catch (e) {
    kc.loadFromDefault();
}

const coreApi = kc.makeApiClient(k8s.CoreV1Api);
const appsApi = kc.makeApiClient(k8s.AppsV1Api);

const PROMETHEUS_URL =
    process.env.PROMETHEUS_URL ||
    "http://monitoring-kube-prometheus-prometheus.monitoring.svc:9090";

async function promQuery(query) {
    try {
        const url = PROMETHEUS_URL + "/api/v1/query?query=" +
            encodeURIComponent(query);

        const response = await fetch(url);

        if (!response.ok) {
            return null;
        }

        const json = await response.json();

        if (
            json.status !== "success" ||
            !json.data ||
            !json.data.result ||
            json.data.result.length === 0
        ) {
            return null;
        }

        return Number(json.data.result[0].value[1]);
    } catch (error) {
        console.log("Prometheus query failed:", error.message);
        return null;
    }
}


async function promMetric(query) {
    try {
        const url = PROMETHEUS_URL + "/api/v1/query?query=" +
            encodeURIComponent(query);

        const response = await fetch(url);

        if (!response.ok) return null;

        const json = await response.json();

        if (
            json.status !== "success" ||
            !json.data ||
            !json.data.result ||
            json.data.result.length === 0
        ) {
            return null;
        }

        return json.data.result[0];
    } catch (error) {
        console.log("Prometheus metric query failed:", error.message);
        return null;
    }
}

async function getDashboardData() {
    const data = {
        application: "UNKNOWN",
        kubernetes: "UNKNOWN",
        deployment: "UNKNOWN",
        runtimeSecurity: "UNKNOWN",
        systemStatus: "UNKNOWN",
        controlPlane: "UNKNOWN",
        workerNode: "UNKNOWN",
        applicationPods: "0",
        falco: "UNKNOWN",
        threatAlerts: 0,
        runningPods: 0,
        falcoEvents: 0,

        falcoVersion: "N/A",
        falcoEngine: "N/A",
        falcoSyscallEvents: 0,
        falcoDroppedEvents: 0,
        falcoRuleMatches: 0,
        falcoDuration: 0,
        falcoEventRate: 0
    };

    try {
        const deployment =
            await appsApi.readNamespacedDeployment(
                "devsecops-app",
                "devsecops"
            );

        const replicas =
            deployment.body.status?.replicas || 0;

        const available =
            deployment.body.status?.availableReplicas || 0;

        data.application =
            available > 0 ? "RUNNING" : "DOWN";

        data.deployment =
            available >= replicas && replicas > 0
                ? "SUCCESS"
                : "DEPLOYING";

    } catch (error) {
        console.log("Deployment check failed:", error.message);
        data.application = "DOWN";
        data.deployment = "FAILED";
    }

    try {
        const pods =
            await coreApi.listNamespacedPod("devsecops");

        const podList = pods.body.items || [];

        const running =
            podList.filter(
                p => p.status?.phase === "Running"
            ).length;

        data.runningPods = running;
        data.applicationPods = String(running);

        data.kubernetes =
            running > 0 ? "READY" : "NOT READY";

    } catch (error) {
        console.log("Pod check failed:", error.message);
    }

    try {
        const nodes = await coreApi.listNode();

        const readyNodes = (nodes.body.items || []).filter(node => {
            const conditions = node.status?.conditions || [];

            return conditions.some(
                c => c.type === "Ready" && c.status === "True"
            );
        });

        data.controlPlane =
            readyNodes.length > 0 ? "READY" : "NOT READY";

        data.workerNode =
            readyNodes.length > 0 ? "READY" : "NOT READY";

    } catch (error) {
        console.log("Node check failed:", error.message);
    }

    const falcoUp =
        await promQuery('up{job="falco-metrics"}');

    const falcoVersion =
        await promMetric('falcosecurity_falco_version_info');

    const falcoEngine =
        await promMetric('falcosecurity_scap_engine_name_info');

    const syscallEvents =
        await promQuery(
            'falcosecurity_scap_n_evts_total'
        );

    const droppedEvents =
        await promQuery(
            'falcosecurity_scap_n_drops_total'
        );

    const ruleMatches =
        await promQuery(
            'sum(falcosecurity_falco_rules_matches_total)'
        );

    const duration =
        await promQuery(
            'falcosecurity_falco_duration_seconds_total'
        );

    const eventRate =
        await promQuery(
            'sum(rate(falcosecurity_scap_n_evts_total[5m]))'
        );

    const threatAlerts =
        await promQuery(
            'sum(increase(falcosecurity_falco_rules_matches_total[1h]))'
        );

    data.falco =
        falcoUp === null ? "N/A" : falcoUp;

    data.runtimeSecurity =
        falcoUp === null ? 0 : falcoUp;

    data.threatAlerts =
        threatAlerts === null
            ? 0
            : Math.round(threatAlerts);

    data.falcoEvents =
        syscallEvents === null
            ? 0
            : Math.round(syscallEvents);

    data.falcoVersion =
        falcoVersion?.metric?.version || "N/A";

    data.falcoEngine =
        falcoEngine?.metric?.engine_name || "N/A";

    data.falcoSyscallEvents =
        syscallEvents === null
            ? 0
            : Math.round(syscallEvents);

    data.falcoDroppedEvents =
        droppedEvents === null
            ? 0
            : Math.round(droppedEvents);

    data.falcoRuleMatches =
        ruleMatches === null
            ? 0
            : Math.round(ruleMatches);

    data.falcoDuration =
        duration === null
            ? 0
            : Math.round(duration);

    data.falcoEventRate =
        eventRate === null
            ? 0
            : Math.round(eventRate);

    data.systemStatus =
        data.application === "RUNNING" &&
        data.kubernetes === "READY" &&
        data.falco === "MONITORING"
            ? "ALL SYSTEMS OPERATIONAL"
            : "CHECK REQUIRED";

    return data;
}


// SonarQube Demo (Intentional Security Hotspot)
const password = "admin123";

app.get("/", async (req, res) => {
const data = await getDashboardData();
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Enterprise DevSecOps Platform v2 v2</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background: #0f172a;
            color: white;
        }

        .header {
            padding: 25px 40px;
            background: #111827;
            border-bottom: 1px solid #334155;
        }

        .header h1 {
            margin: 0;
            font-size: 32px;
        }

        .header p {
            color: #94a3b8;
            margin-top: 8px;
        }

        .container {
            padding: 30px 40px;
        }

        .status {
            background: #064e3b;
            border: 1px solid #10b981;
            padding: 18px;
            border-radius: 10px;
            margin-bottom: 25px;
        }

        .status span {
            color: #34d399;
            font-weight: bold;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            margin-bottom: 25px;
        }

        .card {
            background: #1e293b;
            padding: 22px;
            border-radius: 10px;
            border: 1px solid #334155;
        }

        .card h3 {
            margin-top: 0;
            color: #cbd5e1;
        }

        .number {
            font-size: 28px;
            font-weight: bold;
            margin-top: 10px;
        }

        .green {
            color: #34d399;
        }

        .blue {
            color: #60a5fa;
        }

        .yellow {
            color: #facc15;
        }

        .red {
            color: #f87171;
        }

        .section {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
        }

        .section h2 {
            margin-top: 0;
        }

        .pipeline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
        }

        .stage {
            background: #0f172a;
            border: 1px solid #475569;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            min-width: 120px;
        }

        .arrow {
            color: #60a5fa;
            font-size: 22px;
        }

        .services {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }

        .service {
            background: #0f172a;
            padding: 18px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }

        .service strong {
            display: block;
            margin-bottom: 8px;
        }

        .footer {
            text-align: center;
            padding: 20px;
            color: #64748b;
        }

        @media (max-width: 900px) {
            .cards,
            .services {
                grid-template-columns: 1fr 1fr;
            }
        }

        @media (max-width: 600px) {
            .cards,
            .services {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>

    <div class="header">
        <h1>Enterprise DevSecOps Platform v2 v2</h1>
        <p>Kubernetes Threat Detection & Continuous Delivery Dashboard</p>
    </div>

    <div class="container">

        <div class="status">
            🟢 System Status:
            <span>${data.systemStatus}</span>
        </div>

        <div class="cards">

            <div class="card">
                <h3>Application</h3>
                <div class="number green">RUNNING</div>
            </div>

            <div class="card">
                <h3>Kubernetes</h3>
                <div class="number blue">0</div>
            </div>

            <div class="card">
                <h3>Deployment</h3>
                <div class="number blue">SUCCESS</div>
            </div>

            <div class="card">
                <h3>Runtime Security</h3>
                <div class="number blue">0</div>
            </div>

        </div>

        <div class="section">

            <h2>🚀 CI/CD Pipeline</h2>

            <div class="pipeline">

                <div class="stage">
                    📦<br>
                    <strong>GitHub</strong>
                    Source
                </div>

                <div class="arrow">→</div>

                <div class="stage">
                    ⚙️<br>
                    <strong>Jenkins</strong>
                    CI/CD
                </div>

                <div class="arrow">→</div>

                <div class="stage">
                    🔍<br>
                    <strong>SonarQube</strong>
                    Code Quality
                </div>

                <div class="arrow">→</div>

                <div class="stage">
                    🛡️<br>
                    <strong>Trivy</strong>
                    Image Scan
                </div>

                <div class="arrow">→</div>

                <div class="stage">
                    🐳<br>
                    <strong>Docker</strong>
                    Container
                </div>

                <div class="arrow">→</div>

                <div class="stage">
                    ☸️<br>
                    <strong>Kubernetes</strong>
                    Deployment
                </div>

            </div>

        </div>

        <div class="section">

        <h2>🛡️ Security & Monitoring</h2>

        <div class="cards">

            <div class="card">
                <h3>Falco Version</h3>
                <div class="number blue">${data.falcoVersion}</div>
                <p>Runtime security engine</p>
            </div>

            <div class="card">
                <h3>Falco Engine</h3>
                <div class="number blue">${data.falcoEngine}</div>
                <p>Event capture engine</p>
            </div>

            <div class="card">
                <h3>Syscall Events</h3>
                <div class="number green">${Number(data.falcoSyscallEvents).toLocaleString()}</div>
                <p>Total captured events</p>
            </div>

            <div class="card">
                <h3>Event Rate</h3>
                <div class="number green">${Number(data.falcoEventRate).toLocaleString()}</div>
                <p>Events per second</p>
            </div>

            <div class="card">
                <h3>Rule Matches</h3>
                <div class="number red">${Number(data.falcoRuleMatches).toLocaleString()}</div>
                <p>Triggered Falco rules</p>
            </div>

            <div class="card">
                <h3>Dropped Events</h3>
                <div class="number ${data.falcoDroppedEvents > 0 ? "red" : "green"}">${Number(data.falcoDroppedEvents).toLocaleString()}</div>
                <p>Events dropped</p>
            </div>

            <div class="card">
                <h3>Falco Runtime</h3>
                <div class="number blue">${Number(data.falcoDuration).toLocaleString()}s</div>
                <p>Monitoring duration</p>
            </div>

            <div class="card">
                <h3>Alerts / Hour</h3>
                <div class="number red">${Number(data.threatAlerts).toLocaleString()}</div>
                <p>Rule alerts in last hour</p>
            </div>

        </div>

    </div>

    <div class="section">

        <h2>☸️ Kubernetes Cluster</h2>

        <div class="cards">

            <div class="card">
                <h3>Ready Nodes</h3>
                <div class="number green">${data.controlPlane === "READY" ? 1 : 0}</div>
                <p>Kubernetes nodes</p>
            </div>

            <div class="card">
                <h3>Running Pods</h3>
                <div class="number blue">${Number(data.runningPods).toLocaleString()}</div>
                <p>Currently running</p>
            </div>

            <div class="card">
                <h3>Application Pods</h3>
                <div class="number blue">${Number(data.applicationPods).toLocaleString()}</div>
                <p>DevSecOps application</p>
            </div>

            <div class="card">
                <h3>Falco Alerts</h3>
                <div class="number red">${Number(data.threatAlerts).toLocaleString()}</div>
                <p>Last 1 hour</p>
            </div>

        </div>

    </div>

    <div class="section">

            <h2>📊 Project Components</h2>

            <p>✔ Automated CI/CD using Jenkins</p>
            <p>✔ Static code analysis using SonarQube</p>
            <p>✔ Container vulnerability scanning using Trivy</p>
            <p>✔ Containerization using Docker</p>
            <p>✔ Container orchestration using Kubernetes</p>
            <p>✔ Metrics collection using Prometheus</p>
            <p>✔ Visualization using Grafana</p>
            <p>✔ Runtime threat detection using Falco</p>

        </div>

    </div>

    <div class="footer">
        Enterprise DevSecOps Platform v2 v2 | Kubernetes Threat Detection
    </div>

</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
});

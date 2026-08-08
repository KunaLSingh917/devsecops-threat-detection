const express = require("express");
const app = express();

const PORT = 3000;

// SonarQube Demo (Intentional Security Hotspot)
const password = "admin123";

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Enterprise DevSecOps Platform</title>

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
        <h1>Enterprise DevSecOps Platform</h1>
        <p>Kubernetes Threat Detection & Continuous Delivery Dashboard</p>
    </div>

    <div class="container">

        <div class="status">
            🟢 System Status:
            <span>ALL SYSTEMS OPERATIONAL</span>
        </div>

        <div class="cards">

            <div class="card">
                <h3>Application</h3>
                <div class="number green">RUNNING</div>
            </div>

            <div class="card">
                <h3>Kubernetes</h3>
                <div class="number green">READY</div>
            </div>

            <div class="card">
                <h3>Deployment</h3>
                <div class="number blue">SUCCESS</div>
            </div>

            <div class="card">
                <h3>Runtime Security</h3>
                <div class="number green">ACTIVE</div>
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

            <div class="services">

                <div class="service">
                    <strong>SonarQube</strong>
                    <span class="green">● Active</span>
                    <p>Static Code Analysis</p>
                </div>

                <div class="service">
                    <strong>Trivy</strong>
                    <span class="green">● Active</span>
                    <p>Container Vulnerability Scanning</p>
                </div>

                <div class="service">
                    <strong>Falco</strong>
                    <span class="green">● Active</span>
                    <p>Runtime Threat Detection</p>
                </div>

                <div class="service">
                    <strong>Prometheus</strong>
                    <span class="green">● Active</span>
                    <p>Cluster Metrics Collection</p>
                </div>

                <div class="service">
                    <strong>Grafana</strong>
                    <span class="green">● Active</span>
                    <p>Monitoring & Visualization</p>
                </div>

                <div class="service">
                    <strong>Docker Hub</strong>
                    <span class="green">● Active</span>
                    <p>Container Image Registry</p>
                </div>

            </div>

        </div>

        <div class="section">

            <h2>☸️ Kubernetes Cluster</h2>

            <div class="cards">

                <div class="card">
                    <h3>Control Plane</h3>
                    <div class="number green">READY</div>
                </div>

                <div class="card">
                    <h3>Worker Node</h3>
                    <div class="number green">READY</div>
                </div>

                <div class="card">
                    <h3>Application Pods</h3>
                    <div class="number blue">RUNNING</div>
                </div>

                <div class="card">
                    <h3>Falco</h3>
                    <div class="number green">MONITORING</div>
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
        Enterprise DevSecOps Platform | Kubernetes Threat Detection
    </div>

</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
});

const express = require("express");
const app = express();

const PORT = 3000;

// SonarQube Demo (Intentional Security Hotspot)
const password = "admin123";

app.get("/", (req, res) => {
    res.send(`
        <h1>Enterprise DevSecOps Platform</h1>
        <h2>Deployment Successful ✅</h2>
        <p>CI/CD Pipeline: Jenkins</p>
        <p>Code Quality: SonarQube</p>
        <p>Image Security: Trivy</p>
        <p>Container Platform: Kubernetes</p>
        <p>Runtime Security: Falco</p>
    `);
});

app.listen(PORT, () => {
    console.log(`Application running on port ${PORT}`);
});

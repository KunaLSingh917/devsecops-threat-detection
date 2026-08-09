pipeline {
    agent any

    environment {
        IMAGE_NAME = "kunalsingh7/devsecops-threat-detection"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube') {
                        withCredentials([
                            string(
                                credentialsId: 'sonar-token',
                                variable: 'SONAR_TOKEN'
                            )
                        ]) {
                            dir('app') {
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \
                                    -Dsonar.projectKey=DevSecOps-Threat-Detection \
                                    -Dsonar.sources=. \
                                    -Dsonar.exclusions=node_modules/** \
                                    -Dsonar.token=\$SONAR_TOKEN
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    echo "===== Building Docker Image ====="

                    docker build \
                        --no-cache \
                        -t $IMAGE_NAME:$IMAGE_TAG \
                        ./app

                    docker images | grep devsecops-threat-detection
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    echo "===== Trivy Security Scan ====="

                    trivy image \
                        --severity HIGH,CRITICAL \
                        $IMAGE_NAME:$IMAGE_TAG
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "===== Docker Hub Login ====="

                        echo "$DOCKER_PASS" | docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin

                        echo "===== Pushing Image ====="

                        docker push $IMAGE_NAME:$IMAGE_TAG

                        echo "===== Image Push Completed ====="
                    '''
                }
            }
        }

        stage('Kubernetes Debug') {
            steps {
                sh '''
                    echo "===== Kubernetes Debug ====="

                    kubectl get nodes

                    echo "===== Current DevSecOps Pods ====="

                    kubectl get pods -n devsecops -o wide

                    echo "===== Current Deployment ====="

                    kubectl get deployment devsecops-app -n devsecops
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    echo "===== Deploying Kubernetes Resources ====="

                    kubectl apply -f kubernetes/namespace.yaml
                    kubectl apply -f kubernetes/deployment.yaml
                    kubectl apply -f kubernetes/service.yaml

                    echo "===== Forcing New Image Pull ====="

                    kubectl rollout restart \
                        deployment/devsecops-app \
                        -n devsecops

                    echo "===== Waiting For Rollout ====="

                    kubectl rollout status \
                        deployment/devsecops-app \
                        -n devsecops \
                        --timeout=180s

                    echo "===== Deployment Complete ====="

                    kubectl get pods \
                        -n devsecops \
                        -o wide

                    echo "===== Service ====="

                    kubectl get svc \
                        -n devsecops
                '''
            }
        }

        stage('Verify Application') {
            steps {
                sh '''
                    echo "===== Application Verification ====="

                    sleep 5

                    curl -I \
                        --max-time 10 \
                        http://10.0.2.101:30080

                    echo "===== Application HTML Check ====="

                    curl -s \
                        --max-time 10 \
                        http://10.0.2.101:30080 \
                        | grep -E \
                        "Falco Version|Syscall Events|Rule Matches" \
                        || true
                '''
            }
        }

        stage('OWASP ZAP DAST Scan') {
            steps {
                sh '''
                    echo "===== OWASP ZAP DAST Scan ====="

                    rm -f zap-report.html

                    docker run --rm \
                        --network host \
                        -v "$WORKSPACE:/zap/wrk:rw" \
                        ghcr.io/zaproxy/zaproxy:stable \
                        zap-baseline.py \
                        -t http://10.0.2.101:30080 \
                        -r zap-report.html \
                        || true

                    echo "===== ZAP Scan Completed ====="

                    ls -lh zap-report.html || true
                '''
            }

            post {
                always {
                    archiveArtifacts(
                        artifacts: 'zap-report.html',
                        allowEmptyArchive: true
                    )
                }
            }
        }
    }

    post {

        success {
            echo '''
========================================
 DevSecOps Pipeline SUCCESS
========================================
 GitHub
    ↓
 Jenkins
    ↓
 SonarQube
    ↓
 Trivy
    ↓
 Docker Build
    ↓
 Docker Hub
    ↓
 Kubernetes
    ↓
 OWASP ZAP
    ↓
 Falco + Prometheus + Grafana
========================================
'''
        }

        failure {
            echo '''
========================================
 DevSecOps Pipeline FAILED
========================================
Check the failed stage above.
========================================
'''
        }

        always {
            echo "Pipeline execution completed."
        }
    }
}

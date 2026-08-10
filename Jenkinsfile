pipeline {
    agent any

    triggers {
	pollsSCM("H/ * * * *')
    }

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
                                    -Dsonar.token=\\$SONAR_TOKEN
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

                    echo "===== Docker Image Built ====="

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

                    echo "===== Trivy Scan Completed ====="
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

                        echo "===== Pushing Docker Image ====="

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

                    echo "===== Nodes ====="
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

                    kubectl get pods -n devsecops -o wide

                    echo "===== Kubernetes Service ====="

                    kubectl get svc -n devsecops
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

                    echo "===== Dynamic Dashboard Verification ====="

                    curl -s \
                        --max-time 10 \
                        http://10.0.2.101:30080 \
                        | grep -E \
                        "Falco Version|Syscall Events|Rule Matches" \
                        || true

                    echo "===== Application Verification Completed ====="
                '''
            }
        }

        stage('OWASP ZAP DAST Scan') {
            steps {
                sh '''
                    echo "===== OWASP ZAP DAST Scan ====="

                    rm -rf zap-work
                    mkdir -p zap-work
                    chmod 777 zap-work

                    docker run --rm \
                        --network host \
                        -v "$WORKSPACE/zap-work:/zap/wrk:rw" \
                        ghcr.io/zaproxy/zaproxy:stable \
                        zap-baseline.py \
                        -t http://10.0.2.101:30080 \
                        -r zap-report.html \
                        || true

                    echo "===== ZAP Scan Completed ====="

                    echo "===== ZAP Files ====="
                    ls -lah zap-work || true

                    if [ -f zap-work/zap-report.html ]; then
                        echo "===== ZAP HTML REPORT CREATED ====="
                    else
                        echo "===== ZAP HTML REPORT NOT FOUND ====="
                    fi
                '''
            }

            post {
                always {
                    archiveArtifacts(
                        artifacts: 'zap-work/zap-report.html',
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
       DEVSECOPS PIPELINE SUCCESS
========================================

GitHub
   |
   v
Jenkins
   |
   +----> SonarQube
   |
   +----> Docker Build
   |
   +----> Trivy
   |
   +----> Docker Hub
   |
   +----> Kubernetes
   |
   +----> OWASP ZAP
   |
   +----> Falco
   |
   +----> Prometheus
   |
   +----> Grafana

========================================
'''
        }

        failure {
            echo '''
========================================
       DEVSECOPS PIPELINE FAILED
========================================
Check the failed stage above.
========================================
'''
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}

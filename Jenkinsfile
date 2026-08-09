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
                    docker build \
                    -t $IMAGE_NAME:$IMAGE_TAG \
                    ./app
                '''
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    trivy image $IMAGE_NAME:$IMAGE_TAG
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
                        echo "$DOCKER_PASS" | docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin

                        docker push $IMAGE_NAME:$IMAGE_TAG
                    '''
                }
            }
        }

        stage('Debug Kubernetes') {
            steps {
                sh '''
                    echo "===== Kubernetes Debug ====="
                    whoami
                    echo "HOME=$HOME"
                    echo "KUBECONFIG=$KUBECONFIG"

                    echo "===== Kubernetes Config ====="
                    kubectl config view

                    echo "===== Kubernetes Nodes ====="
                    kubectl get nodes

                    echo "===== DevSecOps Pods ====="
                    kubectl get pods -n devsecops
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    echo "===== Deploying Application ====="

                    kubectl apply -f kubernetes/namespace.yaml
                    kubectl apply -f kubernetes/deployment.yaml
                    kubectl apply -f kubernetes/service.yaml

                    echo "===== Deployment Status ====="

                    kubectl rollout status \
                        deployment/devsecops-app \
                        -n devsecops \
                        --timeout=120s

                    echo "===== Application Pods ====="

                    kubectl get pods -n devsecops

                    echo "===== Application Service ====="

                    kubectl get svc -n devsecops
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
            echo '======================================'
            echo ' DevSecOps Pipeline SUCCESS'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo ' DevSecOps Pipeline FAILED'
            echo '======================================'
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}

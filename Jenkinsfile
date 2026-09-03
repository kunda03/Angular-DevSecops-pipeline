pipeline {

    agent any

    environment {

        // Docker
        DOCKER_IMAGE = 'kundatoke03/course-performance-dashboard:latest'

        // Nexus
        NEXUS_URL = 'http://44.201.199.252:8081'
        NEXUS_REPOSITORY = 'npm-hosted'

        // Kubernetes Infrastructure Repository
        K8S_REPO = 'https://github.com/kunda03/Course-DevSecOps-K8s-Infra.git'
        K8S_BRANCH = 'dev'

        // Kubernetes
        K8S_NAMESPACE = 'course-dashboard'
        K8S_DEPLOYMENT = 'course-dashboard'
    }

    stages {

        // ============================================================
        // 1. CHECKOUT
        // ============================================================

        stage('Checkout') {

            steps {

                echo 'Checking out application source code...'

                checkout scm

                sh '''
                    echo "Current directory:"
                    pwd

                    echo "Application files:"
                    ls -la
                '''
            }
        }


        // ============================================================
        // 2. INSTALL DEPENDENCIES
        // ============================================================

        stage('Install Dependencies') {

            steps {

                echo 'Installing Angular dependencies...'

                sh '''
                    set -e

                    node --version
                    npm --version

                    npm ci

                    echo "Dependencies installed successfully!"
                '''
            }
        }


        // ============================================================
        // 3. TEST
        // ============================================================

        stage('Test') {

            steps {

                echo 'Running Angular unit tests...'

                sh '''
                    set -e

                    npm test -- --watch=false --browsers=ChromeHeadless

                    echo "Unit tests completed successfully!"
                '''
            }
        }


        // ============================================================
        // 4. SONARQUBE ANALYSIS
        // ============================================================

        stage('SonarQube Analysis') {

            steps {

                echo 'Running SonarQube analysis...'

                withSonarQubeEnv('SonarQube') {

                    sh '''
                        set -e

                        sonar-scanner \
                          -Dsonar.projectKey=course-performance-dashboard \
                          -Dsonar.projectName=course-performance-dashboard \
                          -Dsonar.sources=src \
                          -Dsonar.host.url="$SONAR_HOST_URL" \
                          -Dsonar.token="$SONAR_AUTH_TOKEN"

                        echo "SonarQube analysis completed!"
                    '''
                }
            }
        }


        // ============================================================
        // 5. OWASP DEPENDENCY CHECK
        // ============================================================

        stage('OWASP Dependency Check') {

            steps {

                echo 'Running OWASP Dependency Check...'

                sh '''
                    set -e

                    dependency-check \
                      --project "Course Performance Dashboard" \
                      --scan . \
                      --format HTML \
                      --format XML \
                      --out .

                    echo "OWASP Dependency Check completed!"
                '''
            }
        }


        // ============================================================
        // 6. NEXUS REPOSITORY
        // ============================================================

        stage('Nexus Repository') {

            steps {

                echo 'Publishing Angular npm artifact to Nexus...'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'nexus-credentials',
                        usernameVariable: 'NEXUS_USERNAME',
                        passwordVariable: 'NEXUS_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "Creating npm artifact..."

                        npm pack

                        PACKAGE_FILE=$(ls -t course-performance-dashboard-*.tgz | head -1)

                        echo "Package created:"
                        echo "$PACKAGE_FILE"

                        echo "Publishing package to Nexus..."

                        NEXUS_REGISTRY="${NEXUS_URL}/repository/${NEXUS_REPOSITORY}/"

                        AUTH_TOKEN=$(printf '%s' "$NEXUS_USERNAME:$NEXUS_PASSWORD" | base64 -w 0)

                        npm publish "$PACKAGE_FILE" \
                            --registry="$NEXUS_REGISTRY" \
                            --//44.201.199.252:8081/repository/npm-hosted/:_auth="$AUTH_TOKEN" \
                            --//44.201.199.252:8081/repository/npm-hosted/:always-auth=true

                        echo "Artifact successfully published to Nexus!"
                    '''
                }
            }
        }


        // ============================================================
        // 7. ANGULAR BUILD
        // ============================================================

        stage('Angular Build') {

            steps {

                echo 'Building Angular application...'

                sh '''
                    set -e

                    npm run build

                    echo "Angular build completed!"

                    echo "Build output:"
                    find dist -maxdepth 3 -type f | head -30
                '''
            }
        }


        // ============================================================
        // 8. DOCKER BUILD
        // ============================================================

        stage('Docker Build') {

            steps {

                echo 'Building Docker image...'

                sh '''
                    set -e

                    echo "Docker version:"
                    docker --version

                    echo "Building image:"
                    echo "$DOCKER_IMAGE"

                    docker build \
                        -t "$DOCKER_IMAGE" \
                        -f docker/Dockerfile .

                    echo "Docker image built successfully!"

                    docker images "$DOCKER_IMAGE"
                '''
            }
        }


        // ============================================================
        // 9. DOCKERHUB LOGIN
        // ============================================================

        stage('DockerHub Login') {

            steps {

                echo 'Logging into Docker Hub...'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        set -e

                        echo "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USERNAME" \
                            --password-stdin

                        echo "Docker Hub login successful!"
                    '''
                }
            }
        }


        // ============================================================
        // 10. PUSH IMAGE TO DOCKERHUB
        // ============================================================

        stage('Push Image to DockerHub') {

            steps {

                echo 'Pushing Docker image to Docker Hub...'

                sh '''
                    set -e

                    echo "Pushing:"
                    echo "$DOCKER_IMAGE"

                    docker push "$DOCKER_IMAGE"

                    echo "Docker image pushed successfully!"
                '''
            }
        }


        // ============================================================
        // 11. CONNECT TO EKS
        // ============================================================

        stage('Connect to EKS') {

            steps {

                echo 'Connecting Jenkins to EKS cluster...'

                sh '''
                    set -e

                    echo "AWS version:"
                    aws --version

                    echo "Updating kubeconfig..."

                    aws eks update-kubeconfig \
                        --region "${AWS_REGION}" \
                        --name "${EKS_CLUSTER_NAME}"

                    echo "Testing Kubernetes connection..."

                    kubectl get nodes

                    echo "EKS connection successful!"
                '''
            }
        }


        // ============================================================
        // 12. DEPLOY TO KUBERNETES
        // ============================================================

        stage('Deploy to Kubernetes') {

            steps {

                echo 'Deploying Angular application to Kubernetes...'

                sh '''
                    set -e

                    echo "Cloning Kubernetes infrastructure repository..."

                    rm -rf k8s-infra

                    git clone \
                        -b "$K8S_BRANCH" \
                        "$K8S_REPO" \
                        k8s-infra

                    echo "Kubernetes files:"
                    find k8s-infra/k8s -maxdepth 1 -type f -print

                    echo "Applying Kubernetes namespace..."

                    kubectl apply \
                        -f k8s-infra/k8s/namespace.yaml

                    echo "Applying Kubernetes deployment..."

                    kubectl apply \
                        -f k8s-infra/k8s/deployment.yaml

                    echo "Applying Kubernetes service..."

                    kubectl apply \
                        -f k8s-infra/k8s/service.yaml

                    echo "Kubernetes resources applied successfully!"

                    echo "Current resources:"

                    kubectl get all \
                        -n "$K8S_NAMESPACE"
                '''
            }
        }


        // ============================================================
        // 13. VERIFY DEPLOYMENT
        // ============================================================

        stage('Verify Deployment') {

            steps {

                echo 'Verifying Kubernetes deployment...'

                sh '''
                    set -e

                    echo "Checking namespace..."

                    kubectl get namespace "$K8S_NAMESPACE"

                    echo "Checking pods..."

                    kubectl get pods \
                        -n "$K8S_NAMESPACE" \
                        -o wide

                    echo "Checking services..."

                    kubectl get svc \
                        -n "$K8S_NAMESPACE"

                    echo "Checking deployment..."

                    kubectl get deployment "$K8S_DEPLOYMENT" \
                        -n "$K8S_NAMESPACE"

                    echo "Waiting for deployment rollout..."

                    kubectl rollout status \
                        deployment/"$K8S_DEPLOYMENT" \
                        -n "$K8S_NAMESPACE" \
                        --timeout=120s

                    echo "Final pod status..."

                    kubectl get pods \
                        -n "$K8S_NAMESPACE"

                    echo "Final service status..."

                    kubectl get svc \
                        -n "$K8S_NAMESPACE"

                    echo "=============================================="
                    echo "Kubernetes deployment successful!"
                    echo "Namespace : $K8S_NAMESPACE"
                    echo "Deployment: $K8S_DEPLOYMENT"
                    echo "=============================================="
                '''
            }
        }
    }


    // ================================================================
    // POST ACTIONS
    // ================================================================

    post {

        always {

            echo 'Pipeline execution completed.'
        }

        success {

            echo '''
            ==============================================
            Angular CI/CD Pipeline completed successfully!
            ==============================================
            '''
        }

        failure {

            echo '''
            ==============================================
            Angular CI/CD Pipeline failed!
            Check the failed stage in Console Output.
            ==============================================
            '''
        }
    }
}
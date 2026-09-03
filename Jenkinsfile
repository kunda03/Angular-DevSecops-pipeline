pipeline {

    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {

        // =========================================================
        // SonarQube
        // =========================================================
        SCANNER_HOME = tool 'sonar-scanner'

        // =========================================================
        // Chrome
        // =========================================================
        CHROME_BIN = '/usr/bin/google-chrome'

        // =========================================================
        // Docker
        // =========================================================
        DOCKER_IMAGE = 'kundatoke03/course-performance-dashboard:latest'

        // =========================================================
        // AWS EKS
        // =========================================================
        EKS_CLUSTER = 'course-devsecops-cluster'
        AWS_REGION = 'us-east-1'

        // =========================================================
        // Nexus
        // =========================================================
        NEXUS_URL = 'http://44.201.199.252:8081'
        NEXUS_REPOSITORY = 'npm-hosted'
    }

    stages {

        // =========================================================
        // 1. Git Checkout
        // =========================================================
        stage('Git Checkout') {

            steps {

                echo 'Checking out source code from GitHub...'

                checkout scm
            }
        }


        // =========================================================
        // 2. Install Dependencies
        // =========================================================
        stage('Install Dependencies') {

            steps {

                echo 'Installing Angular dependencies...'

                sh '''
                    node --version
                    npm --version
                    npm ci
                '''
            }
        }


        // =========================================================
        // 3. Unit Tests
        // =========================================================
        stage('Unit Tests') {

            steps {

                echo 'Checking Google Chrome installation...'

                sh '''
                    echo "CHROME_BIN=$CHROME_BIN"
                    which google-chrome
                    google-chrome --version
                '''

                echo 'Running Angular unit tests...'

                sh '''
                    export CHROME_BIN=/usr/bin/google-chrome

                    npm test -- \
                        --watch=false \
                        --browsers=ChromeHeadless
                '''
            }
        }


        // =========================================================
        // 4. SonarQube Analysis
        // =========================================================
        stage('SonarQube Analysis') {

            steps {

                echo 'Running SonarQube analysis...'

                withSonarQubeEnv('sonarqube') {

                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                        -Dsonar.projectKey=COURSE-PERFORMANCE-DASHBOARD \
                        -Dsonar.projectName=COURSE-PERFORMANCE-DASHBOARD \
                        -Dsonar.sources=src \
                        -Dsonar.exclusions=**/node_modules/**,**/dist/** \
                        -Dsonar.javascript.lcov.reportPaths=coverage/**/lcov.info
                    """
                }
            }
        }


        // =========================================================
        // 5. OWASP Dependency Check
        // =========================================================
        stage('OWASP Dependency Check') {

            steps {

                echo 'Scanning Angular dependencies for vulnerabilities...'

                dependencyCheck(

                    additionalArguments:
                        '--scan package.json ' +
                        '--scan package-lock.json ' +
                        '--noupdate ' +
                        '--data /var/lib/jenkins/dependency-check-data ' +
                        '--format HTML ' +
                        '--format XML ' +
                        '--failOnCVSS 11',

                    odcInstallation: 'DC'
                )
            }
        }


        // =========================================================
        // 6. Deploy Angular Artifact to Nexus
        // =========================================================
        stage('Deploy to Nexus') {

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

                echo "=============================================="
                echo "Creating unique npm version..."
                echo "=============================================="

                BASE_VERSION=$(node -p "require('./package.json').version")

                UNIQUE_VERSION="${BASE_VERSION}-${BUILD_NUMBER}"

                echo "Base version: ${BASE_VERSION}"
                echo "Publishing version: ${UNIQUE_VERSION}"

                npm version "${UNIQUE_VERSION}" --no-git-tag-version

                echo "=============================================="
                echo "Creating npm artifact..."
                echo "=============================================="

                rm -f *.tgz

                ARTIFACT=$(npm pack)

                echo "Created artifact: ${ARTIFACT}"

                echo "=============================================="
                echo "Publishing package to Nexus..."
                echo "=============================================="

                NEXUS_REGISTRY="${NEXUS_URL}/repository/${NEXUS_REPOSITORY}/"

                AUTH_TOKEN=$(printf '%s' "$NEXUS_USERNAME:$NEXUS_PASSWORD" | base64 -w 0)

                npm publish "${ARTIFACT}" \
                    --registry="$NEXUS_REGISTRY" \
                    --//44.201.199.252:8081/repository/npm-hosted/:_auth="$AUTH_TOKEN" \
                    --//44.201.199.252:8081/repository/npm-hosted/:always-auth=true

                echo "=============================================="
                echo "Artifact successfully published to Nexus!"
                echo "Version: ${UNIQUE_VERSION}"
                echo "Artifact: ${ARTIFACT}"
                echo "=============================================="
            '''
        }
    }
}


        // =========================================================
        // 7. Angular Build
        // =========================================================
        stage('Angular Build') {

            steps {

                echo 'Building Angular application...'

                sh '''
                    npm run build
                '''
            }
        }


        // =========================================================
        // 8. Build Docker Image
        // =========================================================
        stage('Build Docker Image') {

            steps {

                echo 'Building Docker image...'

                sh '''
                    docker build \
                        -t "$DOCKER_IMAGE" \
                        -f docker/Dockerfile .
                '''
            }
        }


        // =========================================================
        // 9. Push Image to Docker Hub
        // =========================================================
        stage('Push Image to Docker Hub') {

            steps {

                echo 'Logging in to Docker Hub...'

                withCredentials([

                    usernamePassword(
                        credentialsId: 'dockerhub-pwd',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_PASSWORD'
                    )

                ]) {

                    sh '''
                        echo "$DOCKERHUB_PASSWORD" | \
                        docker login \
                            --username "$DOCKERHUB_USERNAME" \
                            --password-stdin
                    '''

                    sh '''
                        docker push "$DOCKER_IMAGE"
                    '''
                }
            }
        }


        // =========================================================
        // 10. Configure EKS
        // =========================================================
        stage('Configure EKS') {

            steps {

                echo 'Connecting Jenkins server to EKS cluster...'

                sh '''
                    aws --version

                    aws eks update-kubeconfig \
                        --region "$AWS_REGION" \
                        --name "$EKS_CLUSTER"
                '''
            }
        }


        // =========================================================
        // 11. Deploy to Kubernetes
        // =========================================================
        stage('Deploy to Kubernetes') {

    steps {

        echo 'Deploying Angular application to Kubernetes...'

        sh '''
            set -e

            echo "Cloning Kubernetes infrastructure repository..."

            rm -rf k8s-infra

            git clone -b dev https://github.com/kunda03/Course-DevSecOps-K8s-Infra.git k8s-infra

            echo "Kubernetes files:"
            find k8s-infra/k8s -maxdepth 1 -type f -print

            echo "Applying Kubernetes namespace..."

            kubectl apply -f k8s-infra/k8s/namespace.yaml

            echo "Applying Kubernetes deployment..."

            kubectl apply -f k8s-infra/k8s/deployment.yaml

            echo "Applying Kubernetes service..."

            kubectl apply -f k8s-infra/k8s/service.yaml

            echo "Kubernetes resources applied successfully!"
        '''
    }
}

        // =========================================================
        // 12. Verify Deployment
        // =========================================================
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



    // =============================================================
    // POST ACTIONS
    // =============================================================
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
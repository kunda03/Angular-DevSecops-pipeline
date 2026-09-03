pipeline {

    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {

        // =========================================================
        // SonarQube Scanner
        // =========================================================
        SCANNER_HOME = tool 'sonar-scanner'


        // =========================================================
        // Docker Image
        // =========================================================
        DOCKER_IMAGE = 'kundatoke03/course-performance-dashboard:latest'


        // =========================================================
        // AWS EKS Configuration
        // =========================================================
        EKS_CLUSTER = 'course-devsecops-cluster'

        AWS_REGION = 'us-east-1'


        // =========================================================
        // Nexus Configuration
        // =========================================================
        NEXUS_URL = 'http://YOUR-NEXUS-IP:8081'

        NEXUS_REPOSITORY = 'npm-hosted'
    }


    stages {


        // =========================================================
        // 1. Git Checkout
        // =========================================================
        stage('Git Checkout') {

            steps {

                checkout scm
            }
        }


        // =========================================================
        // 2. Install Dependencies
        // =========================================================
        stage('Install Dependencies') {

            steps {

                echo 'Installing Angular dependencies...'

                sh 'npm ci'
            }
        }


        // =========================================================
        // 3. Unit Tests
        // =========================================================
        stage('Unit Tests') {

            steps {

                echo 'Running Angular unit tests...'

                sh '''
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

                withSonarQubeEnv('sonar-scanner') {

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
                        '--scan . ' +
                        '--format XML ' +
                        '--format HTML',

                    odcInstallation: 'DC'
                )
            }
        }


        // =========================================================
        // 6. Deploy Angular Artifact to Nexus
        // =========================================================
        stage('Deploy to Nexus') {

            steps {

                echo 'Creating Angular npm artifact...'

                sh 'npm pack'


                echo 'Uploading Angular artifact to Nexus...'

                withCredentials([

                    usernamePassword(

                        credentialsId: 'nexus-credentials',

                        usernameVariable: 'NEXUS_USERNAME',

                        passwordVariable: 'NEXUS_PASSWORD'
                    )

                ]) {

                    sh '''
                        ARTIFACT=$(ls *.tgz | head -n 1)

                        curl -u "$NEXUS_USERNAME:$NEXUS_PASSWORD" \
                        --upload-file "$ARTIFACT" \
                        "$NEXUS_URL/repository/$NEXUS_REPOSITORY/$ARTIFACT"
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

                sh 'npm run build'
            }
        }


        // =========================================================
        // 8. Build Docker Image
        // =========================================================
        stage('Build Docker Image') {

            steps {

                echo 'Building Docker image...'

                sh """
                    docker build \
                    -t ${DOCKER_IMAGE} \
                    -f Dockerfile .
                """
            }
        }


        // =========================================================
        // 9. Push Docker Image to Docker Hub
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
                        echo "$DOCKERHUB_PASSWORD" | docker login \
                        --username "$DOCKERHUB_USERNAME" \
                        --password-stdin
                    '''

                    sh 'docker push ${DOCKER_IMAGE}'
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
                    kubectl apply -f k8s/namespace.yaml

                    kubectl apply -f k8s/deployment.yaml

                    kubectl apply -f k8s/service.yaml
                '''
            }
        }


        // =========================================================
        // 12. Verify Deployment
        // =========================================================
        stage('Verify Deployment') {

            steps {

                echo 'Checking Kubernetes deployment...'

                sh '''
                    kubectl get nodes

                    kubectl get pods -n course-dashboard

                    kubectl get deployment -n course-dashboard

                    kubectl get service -n course-dashboard
                '''
            }
        }
    }


    // =============================================================
    // POST ACTIONS
    // =============================================================
    post {

        success {

            echo '=============================================='

            echo 'Angular CI/CD Pipeline completed successfully!'

            echo 'Application deployed to EKS.'

            echo '=============================================='
        }


        failure {

            echo '=============================================='

            echo 'Angular CI/CD Pipeline failed!'

            echo 'Check the failed stage in Console Output.'

            echo '=============================================='
        }


        always {

            echo 'Pipeline execution completed.'
        }
    }
}
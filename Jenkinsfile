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

                echo "Creating unique npm version..."

                # Jenkins BUILD_NUMBER creates a unique version
                VERSION="0.0.${BUILD_NUMBER}"

                echo "Using package version: ${VERSION}"

                npm version "${VERSION}" --no-git-tag-version

                echo "Creating npm artifact..."

                rm -f *.tgz

                npm pack

                ARTIFACT=$(ls *.tgz | head -n 1)

                echo "Created artifact: ${ARTIFACT}"

                echo "Publishing package to Nexus..."

                NEXUS_REGISTRY="${NEXUS_URL}/repository/${NEXUS_REPOSITORY}/"

                AUTH_TOKEN=$(printf "%s:%s" "$NEXUS_USERNAME" "$NEXUS_PASSWORD" | base64 -w 0)

                npm publish "$ARTIFACT" \
                    --registry="$NEXUS_REGISTRY" \
                    --//${NEXUS_REGISTRY#http:}:_auth="$AUTH_TOKEN" \
                    --//${NEXUS_REGISTRY#http:}:always-auth=true

                echo "Package successfully published to Nexus!"
            '''
        }
    }
}
<script setup lang="ts">
const githubUrl = import.meta.env.GITHUB_URL
const commitSha = import.meta.env.GIT_COMMIT_SHA
</script>

<template>
  <footer class="border-top py-3 mt-auto">
    <BContainer class="d-flex hstack flex-wrap justify-content-center justify-content-lg-end">
      <div class="hstack">
        <a
          target="_new"
          class="text-body-secondary me-1"
          href="https://creativecommons.org/licenses/by-sa/4.0/">
          <IFa6BrandsCreativeCommons />
          <IFa6BrandsCreativeCommonsBy />
          <IFa6BrandsCreativeCommonsSa />
        </a>
        by Maran Wolston
      </div>
      <div class="ms-3 hstack">
        <a target="_new" class="text-body-secondary me-1" :href="githubUrl"><IBiGithub /></a>
        <a
          target="_new"
          class="text-body-secondary text-decoration-none"
          :href="`${githubUrl}/commit/${commitSha}`">
          {{ commitSha }}
        </a>
      </div>
      <ImportExportDatabase class="mt-2 mt-sm-0 ms-sm-3" />
    </BContainer>
  </footer>
</template>

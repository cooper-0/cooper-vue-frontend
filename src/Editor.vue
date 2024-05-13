<template>
  <div class="document-editor">
    <h2>{{ workspaceName }}</h2>
    <textarea v-model="documentContent" placeholder="여기에 문서를 작성하세요"></textarea>
  </div>
</template>

<script>
export default {
  name: 'DocumentEditor',
  props: {
    workspaceName: {
      type: String,
      required: true,
    },
    document: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      documentContent: '', // 문서 내용을 담는 데이터
    };
  },
  computed: {
    // document가 변경될 때 documentContent를 업데이트
    documentWatcher() {
      return this.document.content;
    },
  },
  methods: {
  saveDocument() {
    // 상위 컴포넌트에 문서 저장 전달
    this.$emit('save', this.document.id, this.documentContent);
  },
  },
};
</script>

<style>
.document-editor {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
textarea {
  width: 80%;
  height: 300px;
  margin-bottom: 10px;
}
button {
  margin-top: 10px;
}
</style>

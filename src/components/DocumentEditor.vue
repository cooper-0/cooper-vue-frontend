<template>
  <div class="document-editor">
    <div
      class="content"
      contenteditable="true"
      @input="onContentInput"
      ref="editor"
    ></div>
  </div>
</template>

<script>
export default {
  props: ['content'],
  data() {
    return {
      localContent: this.content,
    };
  },
  watch: {
    content(newContent) {
      if (newContent !== this.localContent) {
        this.localContent = newContent;
        this.$refs.editor.innerHTML = newContent;
        this.$emit('update-content', this.localContent);
      }
    }
  },
  methods: {
    onContentInput() {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;

      this.localContent = this.$refs.editor.innerHTML;
      this.$emit('update-content', this.localContent);

      this.$nextTick(() => {
        const newRange = document.createRange();
        newRange.setStart(range.startContainer, startOffset);
        newRange.setEnd(range.endContainer, endOffset);

        selection.removeAllRanges();
        selection.addRange(newRange);
      });
    }
  },
  mounted() {
    this.$refs.editor.innerHTML = this.localContent;
  }
};
</script>

<style scoped>
.document-editor {
  height: 480px;
  flex: 1;
  position: absolute;
  top: 100px;
  width: 1130px;
  box-sizing: border-box;
  overflow-y:hidden;
  overflow-x: hidden;
}

.content {
  width: calc(100% - 10px);
  margin-top: 20px;
  padding: 5px;
  background-color: #fff;
  border-radius: 4px;
  height: 450px;
  overflow-y: auto;
  scrollbar-width: none;
}
</style>

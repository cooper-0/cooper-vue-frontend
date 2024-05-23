<template>
    <div class="document-editor">
      <div
        class="content"
        contenteditable="true"
        @input="onContentInput"
        ref="editor"
      ></div>
      <button @click="saveContent">저장</button>
    </div>
  </template>
  
  <script>
  export default {
    props: ['content'],
    data() {
      return {
        localContent: this.content
      };
    },
    watch: {
      content(newContent) {
        if (newContent !== this.localContent) {
          this.localContent = newContent;
          this.$refs.editor.innerHTML = newContent;
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
      },
      saveContent() {
        this.$emit('save-content', this.localContent);
      }
    },
    mounted() {
      this.$refs.editor.innerHTML = this.localContent;
    }
  };
  </script>
  
  <style scoped>
  .document-editor {
    position: fixed;
    top: 100px;
    left: 250px;
    width: 816px;
    height: 800px;
    box-sizing: border-box;
  }
  
  .content {
    min-height: 400px;
    margin-top: 20px;
    border: 2px solid #ccc;
    padding: 5px;
    overflow-y: auto;
    background-color: #fff;
    border-radius: 4px;
  }
  
  button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    background-color: #888;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #999
  }
  </style>  
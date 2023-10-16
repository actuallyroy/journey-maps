class DraggableListElem {
  constructor(options) {
    let { listArray, container, renderer, className } = options;
    this.html = "";
    this.listArray = listArray;
    this.container = container;
    this.renderer = renderer;
    this.className = className;
    this.updateList();
  }

  getHtml() {
    return this.html;
  }

  updateList() {
    this.container.innerHTML = "";
    this.listArray.forEach((marker, index) => {
      let markerElem = document.createElement("div");
      markerElem.classList.add(this.className);
      markerElem.setAttribute("index", index);
      markerElem.setAttribute("draggable", true);
      markerElem.innerHTML = this.renderer(marker);
      if (this.container) this.container.appendChild(markerElem);
      this.html += markerElem.outerHTML;
      // markerElem.ondragstart = () => {
      // }
      markerElem.ondrag = (e) => {
        // markerElem.style.display = "none"
        this.tempElem = markerElem;
        // this.tempElem.style.boxShadow = "inset 0px 0px 0px 1px #000";
        this.tempElem.classList.add("active-drag-list");
        this.tempElem.style.boxShadow = "0 0 6px rgba(0, 0, 0, 0.25), inset 0px 0px 0px 1px #000";
        this.dragElemIndex = markerElem.getAttribute("index");
      };
      markerElem.ondragend = () => {
        this.tempElem.classList.remove("active-drag-list");
        this.shiftElement(this.listArray, this.dragElemIndex, this.targetElemIndex);
        this.updateList();
        const dragEvent = new CustomEvent("onDrag", {
          detail: {
            listArray: this.listArray,
            srcElem: this.tempElem,
          },
        });
        this.container.dispatchEvent(dragEvent);
      };
      markerElem.ondragover = (e) => {
        let h = parseInt(getComputedStyle(markerElem).height);
        if (e.offsetY < h / 4) {
          this.container.insertBefore(this.tempElem, markerElem);
          if (markerElem.getAttribute("index") != this.dragElemIndex) this.targetElemIndex = markerElem.getAttribute("index");
        }
      };
      markerElem.ontouchstart = (e) => {
        if(e.target.className.indexOf("bi") != -1){
        this.touchStartX = e.touches[0].clientY;
        this.tempElem = markerElem;
        this.dragElemIndex = parseInt(markerElem.getAttribute("index"));
        this.tempElem.classList.add("active-drag-list");
        }
      };
      markerElem.ontouchmove = (e) => {
        if (e.target.className.indexOf("bi") != -1) {
          e.preventDefault()
          let offsetY = e.touches[0].clientY - this.touchStartX;
          let h = parseInt(getComputedStyle(markerElem).height);
          offsetY += h / 2;
          this.targetElemIndex = Math.floor(offsetY / h) + this.dragElemIndex;
          let targetElem = this.container.children[this.targetElemIndex];
          this.container.insertBefore(this.tempElem, targetElem);
          if (markerElem.getAttribute("index") != this.dragElemIndex) this.targetElemIndex = markerElem.getAttribute("index");
        }
      };
      markerElem.ontouchend = (e) => {
        if (e.target.className.indexOf("bi") != -1) {
          this.tempElem.classList.remove("active-drag-list");
          this.shiftElement(this.listArray, this.dragElemIndex, this.targetElemIndex);
          this.updateList();
          this.dragElemIndex = 0;
          this.targetElemIndex = 0;
          const dragEvent = new CustomEvent("onDrag", {
            detail: {
              listArray: this.listArray,
              srcElem: this.tempElem,
            },
          });
          this.container.dispatchEvent(dragEvent);
        }
      };
    });
    let tempDiv = document.createElement("div");
    tempDiv.classList.add(this.className);
    tempDiv.style.opacity = 0;
    tempDiv.ondragenter = (e) => {
      this.container.insertBefore(this.tempElem, tempDiv);
    };
    this.container.appendChild(tempDiv);
  }

  onDrag(callback) {
    this.container.addEventListener("onDrag", (e) => {
      callback(e.detail);
    });
  }

  shiftElement(arr, fromIndex, toIndex) {
    console.log(fromIndex, toIndex);
    if (fromIndex >= 0 && fromIndex < arr.length && toIndex >= 0 && toIndex < arr.length && fromIndex != toIndex) {
      const elementToShift = arr.splice(fromIndex, 1)[0]; // Remove the element to shift
      console.log(elementToShift);
      if (fromIndex > toIndex || toIndex == arr.length) {
        arr.splice(toIndex, 0, elementToShift); // Insert the element at the new index
      } else {
        arr.splice(toIndex - 1, 0, elementToShift); // Insert the element at the new index
      }
    } else {
      console.log("Invalid indices for shifting.");
    }
  }
}

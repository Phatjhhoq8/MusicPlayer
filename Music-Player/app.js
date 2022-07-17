const PLAYER_STORAGE_KEY = "F8_PLAYER";
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const cd = $(".cd");
const heading = $("header h2");
const cdThumb = $(".cd-thumb");
const audio = $("#audio");
const playBtn = $(".btn-toggle-play");
const player = $(".player");
const progress = $("#progress");
const nextBtn = $(".btn-next");
const prevBtn = $(".btn-prev");
const randBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const playlist = $(".playlist");
const addName = $("header h3");
const exit = $(".icon-x");
const modal = $(".modal");
const box = $(".box");
const submit = $("#submit");

const app = {
    currentIndex: 0,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig: function(key, value) {
        (app.config[key] = value),
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(app.config));
    },
    //render playlist
    render: function(data) {
        const htmls = data.map((song, index) => {
            return `
            <div data-id = ${song.id} data-index = ${index} class="song ${
        index === app.currentIndex ? "active" : ""
      } ">
                <div class="thumb" style="background-image: url('${
                  song.imgUrl
                }')"></div>
                <div class="body">
                    <h3 class="title">${song.title}</h3>
                    <p class="author">${song.singer}</p>
                </div>
                <div class="option">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            
            `;
        });
        playlist.innerHTML = htmls.join("");
    },
    // định nghĩa các thuộc tính của object
    defineProperties: function(data) {
        Object.defineProperty(app, "currentSong", {
            get: function() {
                return data[app.currentIndex];
            },
        });
    },
    // đưa tk đang phát lên vị trí đầu
    scrollToActiveSong: function(data) {
        setTimeout(() => {
            $(".song.active").scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 200);
    },
    // tải thông tin bài hát đầu tiên vào UI khi chạy ứng dụng
    loadCurrentSong: function(data) {
        heading.innerText = data[app.currentIndex].title;
        cdThumb.style.backgroundImage = `url('${data[app.currentIndex].imgUrl}')`;
        audio.src = app.currentSong.audioSrc;
    },
    loadConfig: function() {
        app.isRandom = this.config.isRandom;
        app.isRepeat = this.config.isRepeat;
    },
    createSong: function(data, cb) {
        fetch("http://localhost:3000/songs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
            .then(function(respon) {
                return respon.json();
            })
            .then(cb);
    },
    // lắng nghe thuộc tính các sự kiện
    handleEvent: function(data) {
        const cdWidth = cd.offsetWidth;
        // quay cd
        const cdThumbAnimate = cdThumb.animate([{ transform: "rotate(360deg)" }], {
            duration: 10000,
            iterations: Infinity,
        });
        cdThumbAnimate.pause();
        // xử lý phóng to thu nhỏ CD
        document.onscroll = function() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const newCdWidth = cdWidth - scrollTop;
            cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0;
            cd.style.opacity = newCdWidth / cdWidth;
        };
        // xử lý nút play
        playBtn.onclick = function(e) {
            player.classList.toggle("playing");
            const playerActive = $(".playing");
            if (playerActive) {
                audio.play();
                cdThumbAnimate.play();
            } else {
                audio.pause();
                cdThumbAnimate.pause();
            }
        };
        audio.ontimeupdate = function(e) {
            if (audio.duration) {
                const progressPercent = Math.floor(
                    (audio.currentTime / audio.duration) * 100
                );
                progress.value = progressPercent;
            }
        };
        // xử lý khi tua
        progress.onchange = function(e) {
            audio.currentTime = (audio.duration / 100) * e.target.value;
        };
        // khi next song
        nextBtn.onclick = function(e) {
            app.nextSong(data);
            audio.play();
            player.classList.add("playing");
        };
        // xử lí khi quay lùi
        prevBtn.onclick = function(e) {
            app.prevSong(data);
            audio.play();
            player.classList.add("playing");
        };
        // random bài hát
        randBtn.onclick = function(e) {
            app.isRandom = !app.isRandom;
            randBtn.classList.toggle("active", app.isRandom);
            do {
                var temp = Math.floor(Math.random() * data.length);
            } while (temp == app.currentIndex);
            app.currentIndex = temp;
            app.setConfig("isRandom", app.isRandom);
        };
        repeatBtn.onclick = function(e) {
            app.isRepeat = !app.isRepeat;
            repeatBtn.classList.toggle("active", app.isRepeat);
            app.setConfig("isRepeat", app.isRepeat);
        };
        audio.onended = function() {
            if (!app.isRepeat) {
                app.nextSong(data);
                audio.play();
            } else {
                app.loadCurrentSong(data);
                audio.play();
            }
        };
        // lắng nghe hành vi click vào playlist
        playlist.onclick = function(e) {
            const songNode = e.target.closest(".song:not(.active)");
            if (songNode || e.target.closest(".option")) {
                //xử lý click vào song
                if (songNode) {
                    app.currentIndex = Number(songNode.dataset.index);
                    app.loadCurrentSong(data);
                    audio.play();
                    player.classList.add("playing");
                    cdThumbAnimate.play();
                    app.render(data);
                }
                // xử lý khi click vào song option
                const id = songNode.dataset.id;
                const del = $(".option");
                if (e.target.closest(".option")) {
                    e.stopPropagation();
                    fetch("http://localhost:3000/songs" + "/" + `${id}`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        })
                        .then(function(respone) {
                            return respone.json();
                        })
                        .then(app.render);
                }
            }
        };
        addName.onclick = function(e) {
            e.stopPropagation();
            modal.classList.add("active");
            box.classList.add("active");
            setTimeout(() => {
                $(".box").scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 100);
        };
        exit.onclick = function(e) {
            modal.classList.remove("active");
            box.classList.remove("active");
        };
        submit.onclick = function(e) {
            const name = $('input[name="nameSong"]').value;
            const singer = $('input[name="singer"]').value;
            const image = $('input[name="image"]').value;
            const audioAdd = $('input[name="audioAdd"]').value;
            var data = {
                title: name,
                singer: singer,
                imgUrl: image,
                audioSrc: audioAdd,
            };
            app.createSong(data, app.render);
        };
    },
    nextSong(data) {
        if (!app.isRandom) {
            app.currentIndex++;
            if (app.currentIndex >= data.length) {
                app.currentIndex = 0;
            }
            app.loadCurrentSong(data);
            app.render(data);
            app.scrollToActiveSong();
        } else {
            app.loadCurrentSong(data);
            app.render(data);
            app.scrollToActiveSong();
            do {
                var temp = Math.floor(Math.random() * data.length);
            } while (temp == app.currentIndex);
            app.currentIndex = temp;
        }
    },
    prevSong(data) {
        if (!app.isRandom) {
            app.currentIndex--;
            if (app.currentIndex < 0) {
                app.currentIndex = data.length;
            }
            app.loadCurrentSong(data);
            app.render(data);
            app.scrollToActiveSong();
        } else {
            app.loadCurrentSong(data);
            app.render(data);
            app.scrollToActiveSong();
            do {
                var temp = Math.floor(Math.random() * data.length);
            } while (temp == app.currentIndex);
            app.currentIndex = temp;
        }
    },
    start: function() {
        this.loadConfig();
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.handleEvent);
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.render);
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.defineProperties);
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.loadCurrentSong);
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.nextSong);
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.prevSong);
        fetch("http://localhost:3000/songs")
            .then(function(respone) {
                return respone.json();
            })
            .then(this.scrollToActiveSong);
        //hiển thị trạng thái ban đầu
        randBtn.classList.toggle("active", app.isRandom);
        repeatBtn.classList.toggle("active", app.isRepeat);
    },
};
app.start();
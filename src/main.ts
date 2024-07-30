import './style.css'
import axios from 'axios';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Engine {
  setTags(): void,
  searchByTitle(title: string): Promise<void>
  searchByTags(includes: string[], excludes: string[]): Promise<void>,
  exportToCSV(): Promise<void>
}

class MangaDex implements Engine {
  baseUrl = 'https://corsproxy.io/?https://api.mangadex.org';
  results_mDex: any[] = [];

  async setTags() {
    await sleep(200);

    const tags = await axios(`${this.baseUrl}/manga/tag`);
    let selectHtml = '<option value="none">none</option>\n';

    let tagArrays = [];

    for (const tag of tags.data.data) {
      tagArrays.push([tag.id, tag.attributes.name.en]);
    }
    tagArrays = tagArrays.sort((a, b) => {
      if (a[1].toLowerCase() < b[1].toLowerCase()) return -1;
      if (a[1].toLowerCase() > b[1].toLowerCase()) return 1;
      return 0;
    })

    for(const tag of tagArrays) {
      selectHtml += `<option value="${tag[0]}">${tag[1]}</option>\n`;
    }

    document.getElementById('includes-tag')!.innerHTML = selectHtml;
    document.getElementById('excludes-tag')!.innerHTML = selectHtml;
  }
  async searchByTitle(title: string) {
    if(title.trim().length == 0) {
      document.getElementById("info")!.innerText = `You need to write title to search it!`;
      return;
    }

    await sleep(200);

    const resp = await axios({
      method: 'GET',
      url: `${this.baseUrl}/manga?limit=10`,
      params: {
        title: title,
        originalLanguage: ['ja']
      },
    });

    let current = resp.data.data.length;
    let total = resp.data.total;
    let offset = resp.data.offset;

    document.getElementById("info")!.innerText = `Fetching by text... ${current}/${total}  (f5 to stop) (title: ${title})`;

    this.results_mDex = [...this.results_mDex, ...resp.data.data];
    while(current < total) {
      await sleep(300);

      const resp = await axios({
        method: 'GET',
        url: `${this.baseUrl}/manga?limit=10`,
        params: {
          title: title,
          offset: offset,
          limit: 100,
          originalLanguage: ['ja']
        },
      });

      current += resp.data.data.length;
      offset += resp.data.data.length;

      document.getElementById("info")!.innerText = `Fetching by text... ${current}/${total} (f5 to stop) (title: ${title})`;
      this.results_mDex = [...this.results_mDex, ...resp.data.data];
    }

    console.log(this.results_mDex);
    document.getElementById("info")!.innerHTML = `<span style="font-size: 2em; color: yellow;">ready to export! (title: ${title})</span>`;
  }
  async searchByTags(includes: string[], excludes: string[]) {
    if(includes.length == 0 && excludes.length == 0) {
      document.getElementById("info")!.innerText = `At least one tag must be selected!`;
      return;
    }

    await sleep(200);

    const resp = await axios({
      method: 'GET',
      url: `${this.baseUrl}/manga?limit=10`,
      params: {
        includedTags: includes,
        excludedTags: excludes,
        originalLanguage: ['ja']
      },
    });

    let current = resp.data.data.length;
    let total = resp.data.total;
    let offset = resp.data.offset;

    document.getElementById("info")!.innerText = `Fetching by tags... ${current}/${total} (f5 to stop) (incl: ${includes}, excl: ${excludes})`;

    this.results_mDex = [...this.results_mDex, ...resp.data.data];
    while(current < total) {
      await sleep(300);

      const resp = await axios({
        method: 'GET',
        url: `${this.baseUrl}/manga?limit=100`,
        params: {
          includedTags: includes,
          excludedTags: excludes,
          originalLanguage: ['ja']
        },
      });

      current += resp.data.data.length;
      offset += resp.data.data.length;

      document.getElementById("info")!.innerText = `Fetching by tags... ${current}/${total} (f5 to stop) (incl: ${includes}, excl: ${excludes})`;
      this.results_mDex = [...this.results_mDex, ...resp.data.data];
    }

    console.log(this.results_mDex);
    document.getElementById("info")!.innerHTML = `<span style="font-size: 2em; color: yellow;">ready to export! (incl: ${includes}, excl: ${excludes})</span>`;
  }
  async exportToCSV() {
    if(this.results_mDex.length == 0) {
      document.getElementById("info")!.innerHTML = `<span style="font-size: 2em; color: red;">There are no results!</span>`;
    };

    let csv_lines: string[] = [
      'title,year,tags,link'
    ];
    for(const manga of this.results_mDex) {
      if(manga.attributes.availableTranslatedLanguages.includes("en")) continue;

      let title: string = manga.attributes.title.en;
      let tags: string[] = [];
      let link = `https://mangadex.org/title/${manga.id}`;
      let year_of_publication = manga.attributes.year;

      for(const tag of manga.attributes.tags) {
        tags.push(tag.attributes.name.en);
      }

      csv_lines.push(`"${title.replaceAll("\"", "\"\"")}",${year_of_publication == null ? 0 : year_of_publication},"${tags.join(', ')}","${link}"`);
    }

    csv_lines = [...new Set(csv_lines)];

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv_lines.join('\n')));
    element.setAttribute('download', 'results.csv');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

class MangaUpdates implements Engine {
  baseUrl = 'https://api.mangaupdates.com/v1';
  results_mDex: any[] = [];

  async setTags() {
    await sleep(200);

    const tags = await axios(`${this.baseUrl}/genres`, {
      withCredentials: false
    });
    let selectHtml = '<option value="none">none</option>\n';

    let tagArrays = [];

    for (const tag of tags.data) {
      tagArrays.push([tag.id, tag.genre]);
    }
    tagArrays = tagArrays.sort((a, b) => {
      if (a[1].toLowerCase() < b[1].toLowerCase()) return -1;
      if (a[1].toLowerCase() > b[1].toLowerCase()) return 1;
      return 0;
    })

    for(const tag of tagArrays) {
      selectHtml += `<option value="${tag[0]}">${tag[1]}</option>\n`;
    }

    document.getElementById('includes-tag')!.innerHTML = selectHtml;
    document.getElementById('excludes-tag')!.innerHTML = selectHtml;
  }
  async searchByTitle(title: string) {
    if(title.trim().length == 0) {
      document.getElementById("info")!.innerText = `You need to write title to search it!`;
      return;
    }

    await sleep(200);

    const resp = await axios.post(`${this.baseUrl}/series/search`, {
      search: title
    }, {
      withCredentials: false
    });

    console.log(resp.data);

    // let current = resp.data.data.length;
    // let total = resp.data.total;
    // let offset = resp.data.offset;

    // document.getElementById("info")!.innerText = `Fetching by text... ${current}/${total}  (f5 to stop) (title: ${title})`;

    // this.results_mDex = [...this.results_mDex, ...resp.data.data];
    // while(current < total) {
    //   await sleep(300);

    //   const resp = await axios({
    //     method: 'GET',
    //     url: `${this.baseUrl}/manga?limit=10`,
    //     params: {
    //       title: title,
    //       offset: offset,
    //       limit: 100,
    //       originalLanguage: ['ja']
    //     },
    //   });

    //   current += resp.data.data.length;
    //   offset += resp.data.data.length;

    //   document.getElementById("info")!.innerText = `Fetching by text... ${current}/${total} (f5 to stop) (title: ${title})`;
    //   this.results_mDex = [...this.results_mDex, ...resp.data.data];
    // }

    // console.log(this.results_mDex);
    // document.getElementById("info")!.innerHTML = `<span style="font-size: 2em; color: yellow;">ready to export! (title: ${title})</span>`;
  }
  async searchByTags(includes: string[], excludes: string[]) {
    if(includes.length == 0 && excludes.length == 0) {
      document.getElementById("info")!.innerText = `At least one tag must be selected!`;
      return;
    }

    await sleep(200);

    const resp = await axios.post(`${this.baseUrl}/series/search`, {
      search: ""
    });

    let current = resp.data.data.length;
    let total = resp.data.total;
    let offset = resp.data.offset;

    document.getElementById("info")!.innerText = `Fetching by tags... ${current}/${total} (f5 to stop) (incl: ${includes}, excl: ${excludes})`;

    this.results_mDex = [...this.results_mDex, ...resp.data.data];
    while(current < total) {
      await sleep(300);

      const resp = await axios({
        method: 'GET',
        url: `${this.baseUrl}/manga?limit=100`,
        params: {
          includedTags: includes,
          excludedTags: excludes,
          originalLanguage: ['ja']
        },
      });

      current += resp.data.data.length;
      offset += resp.data.data.length;

      document.getElementById("info")!.innerText = `Fetching by tags... ${current}/${total} (f5 to stop) (incl: ${includes}, excl: ${excludes})`;
      this.results_mDex = [...this.results_mDex, ...resp.data.data];
    }

    console.log(this.results_mDex);
    document.getElementById("info")!.innerHTML = `<span style="font-size: 2em; color: yellow;">ready to export! (incl: ${includes}, excl: ${excludes})</span>`;
  }
  async exportToCSV() {
    if(this.results_mDex.length == 0) {
      document.getElementById("info")!.innerHTML = `<span style="font-size: 2em; color: red;">There are no results!</span>`;
    };

    let csv_lines: string[] = [
      'title,year,tags,link'
    ];
    for(const manga of this.results_mDex) {
      if(manga.attributes.availableTranslatedLanguages.includes("en")) continue;

      let title: string = manga.attributes.title.en;
      let tags: string[] = [];
      let link = `https://mangadex.org/title/${manga.id}`;
      let year_of_publication = manga.attributes.year;

      for(const tag of manga.attributes.tags) {
        tags.push(tag.attributes.name.en);
      }

      csv_lines.push(`"${title.replaceAll("\"", "\"\"")}",${year_of_publication == null ? 0 : year_of_publication},"${tags.join(', ')}","${link}"`);
    }

    csv_lines = [...new Set(csv_lines)];

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv_lines.join('\n')));
    element.setAttribute('download', 'results.csv');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}

let engine = new MangaDex();

for (const el of document.getElementsByClassName("select-engine")) {
  el.addEventListener("change", (value) => {
    console.log((value.target as HTMLInputElement).value)
    if((value.target as HTMLInputElement).value == "mangaupdates") {
      engine = new MangaUpdates()
      engine.setTags();
    } else {
      engine = new MangaDex();
      engine.setTags();
    } 
  })
}

engine.setTags();

document.getElementById("search-by-title")?.addEventListener("click", async () => {
  await engine.searchByTitle((document.getElementById("search")! as HTMLInputElement).value);
});
document.getElementById("search-by-tags")?.addEventListener("click", async () => {
  let includedOptions = (document.getElementById("includes-tag") as HTMLSelectElement).selectedOptions;
  let excludedOptions = (document.getElementById("excludes-tag") as HTMLSelectElement).selectedOptions;

  let included: string[] = [];
  let excluded: string[] = [];

  for(const opt of includedOptions) {
    if(opt.value != "none")
      included.push(opt.value);
  }
  for(const opt of excludedOptions) {
    if(opt.value != "none")
      excluded.push(opt.value);
  }

  await engine.searchByTags(
    included,
    excluded
  );
});
document.getElementById("export-to-csv")?.addEventListener("click", () => {
  engine.exportToCSV()
});
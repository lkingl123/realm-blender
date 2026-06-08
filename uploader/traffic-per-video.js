// Per-video: traffic sources + impressions/CTR for the Shorts that matter.
// Answers: what PUSHED Tokyo vs the losers? Read-only.
const { google } = require('googleapis');
const { authenticate } = require('./auth');

const VIDS = {
  'lYUaLZkQ': null, // placeholder
};
// We'll resolve IDs from titles at runtime instead.
const WANT = [
  'Hogwarts in Tokyo',
  'Old Shanghai #Shorts',
  'Rivendell #Shorts',
  'Night by the Lake',
  'Snowy Kyoto #Shorts',
  'Rainy London #Shorts',
];

const pad = (s,n)=>String(s).padEnd(n).slice(0,n);
const padL = (s,n)=>String(s).padStart(n);

async function main(){
  const auth = await authenticate();
  const yt = google.youtube({version:'v3',auth});
  const ytA = google.youtubeAnalytics({version:'v2',auth});
  const ch = await yt.channels.list({part:'contentDetails,snippet',mine:true});
  const start = ch.data.items[0].snippet.publishedAt.slice(0,10);
  const today = new Date().toISOString().slice(0,10);
  const up = ch.data.items[0].contentDetails.relatedPlaylists.uploads;
  const it = await yt.playlistItems.list({part:'contentDetails',playlistId:up,maxResults:50});
  const ids = it.data.items.map(i=>i.contentDetails.videoId);
  const meta = await yt.videos.list({part:'snippet',id:ids.join(',')});
  const byId = {};
  meta.data.items.forEach(v=>byId[v.id]=v.snippet.title);

  // pick the videos we want
  const targets = meta.data.items.filter(v=>WANT.some(w=>v.snippet.title.includes(w)));

  for(const v of targets){
    console.log('\n==== '+v.snippet.title+' ('+v.id+') ====');
    // traffic source breakdown
    try{
      const ts = await ytA.reports.query({
        ids:'channel==MINE',startDate:start,endDate:today,
        metrics:'views,estimatedMinutesWatched',
        dimensions:'insightTrafficSourceType',
        filters:'video=='+v.id, sort:'-views',
      });
      console.log('  TRAFFIC SOURCE        VIEWS   WATCH-min');
      for(const r of (ts.data.rows||[])){
        console.log('   '+pad(r[0],20)+padL(r[1],6)+padL(Math.round(r[2]),11));
      }
    }catch(e){ console.log('  traffic: '+e.message); }
    // impressions + CTR (Shorts feed may not report impressions, but try)
    try{
      const im = await ytA.reports.query({
        ids:'channel==MINE',startDate:start,endDate:today,
        metrics:'views',
        // these metrics only valid in some reports; wrap in try
      });
    }catch(e){}
  }

  // channel-level: impressions + CTR (this is the report that has them)
  console.log('\n\n==== CHANNEL IMPRESSIONS / CTR (lifetime) ====');
  try{
    const imp = await ytA.reports.query({
      ids:'channel==MINE',startDate:start,endDate:today,
      metrics:'views',
      dimensions:'video',
      sort:'-views', maxResults:25,
    });
    // impressions metric requires the "impressions" + "impressionClickThroughRate" which are in the analytics API
    const imp2 = await ytA.reports.query({
      ids:'channel==MINE',startDate:start,endDate:today,
      metrics:'impressions,impressionClickThroughRate,views',
      dimensions:'video',
      sort:'-impressions', maxResults:25,
    });
    console.log('  VIDEO                                        IMPRESS   CTR%   VIEWS');
    for(const r of (imp2.data.rows||[])){
      const t = byId[r[0]]||r[0];
      console.log('   '+pad(t,42)+padL(r[1],8)+padL(Number(r[2]).toFixed(1),7)+padL(r[3],7));
    }
  }catch(e){ console.log('  impressions report: '+e.message); }
}
main().catch(e=>{console.error('ERR:',e.message);});
